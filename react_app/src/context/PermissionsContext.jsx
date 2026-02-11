import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
    const [userPermissions, setUserPermissions] = useState([]);
    const [userRole, setUserRole] = useState(sessionStorage.getItem("cargo") || "Usuario");
    const [isAdminRole, setIsAdminRole] = useState(userRole === "Admin");
    const [isLoading, setIsLoading] = useState(true);

    const fetchPermissions = async () => {
        const cargo = sessionStorage.getItem("cargo");
        const token = sessionStorage.getItem("token");

        if (!cargo || !token) {
            setUserPermissions([]);
            setIsAdminRole(false);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/roles/name/${encodeURIComponent(cargo)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setUserPermissions(data.permissions || []);
                setIsAdminRole(data.name === "Admin");
                setUserRole(data.name);
            }
        } catch (error) {
            console.error("Error fetching permissions in context:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();

        const interval = setInterval(() => {
            const currentCargo = sessionStorage.getItem("cargo");
            const currentToken = sessionStorage.getItem("token");

            // Si no había permisos y ahora hay token, o si cambió el cargo
            if ((!userPermissions.length && currentToken) || (currentCargo !== userRole)) {
                fetchPermissions();
            }
        }, 2000); // Un poco más rápido para mejorar la UX post-login

        return () => clearInterval(interval);
    }, [userRole, userPermissions.length]);

    return (
        <PermissionsContext.Provider value={{ userPermissions, userRole, isAdminRole, isLoading, refreshPermissions: fetchPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionsContext);
    if (!context) {
        throw new Error("usePermissions must be used within a PermissionsProvider");
    }
    return context;
};

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { API_BASE_URL, CURRENT_TENANT } from "../utils/api";
import LoadingCard from "../clientPages/components/LoadingCard";

export default function ProtectedRoute({ children, permission }) {
   const [loading, setLoading] = useState(true);
   const [isAuth, setIsAuth] = useState(false);
   const [userPermissions, setUserPermissions] = useState([]);
   const location = useLocation();

   // Definimos los tenants que actúan como "Admin" o "Main DB"
   const adminTenants = ["api", "formsdb", "infodesa", "acciona", "solunex"];
   const isAdminContext = adminTenants.includes(CURRENT_TENANT);

   useEffect(() => {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
         document.documentElement.classList.add("dark");
      }

      return () => {
         if (theme === "dark") {
            document.documentElement.classList.remove("dark");
         }
      };
   }, []);

   useEffect(() => {
      const validarToken = async () => {
         const token = sessionStorage.getItem("token");
         const email = sessionStorage.getItem("email");
         const cargo = sessionStorage.getItem("cargo");

         if (!token || !email) {
            setIsAuth(false);
            setLoading(false);
            return;
         }

         try {
            // 1. Validar token básico
            const res = await fetch(`${API_BASE_URL}/auth/validate`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ token, email, cargo }),
            });

            if (!res.ok) throw new Error("Sesión inválida");

            // 2. Verificar Permisos del Rol (RBAC)
            if (!cargo) throw new Error("Rol no definido");

            const roleRes = await fetch(`${API_BASE_URL}/roles/name/${encodeURIComponent(cargo)}`, {
               headers: { Authorization: `Bearer ${token}` },
            });

            if (!roleRes.ok) throw new Error("Error verificando permisos del rol");

            const roleData = await roleRes.json();
            const permissions = roleData.permissions || [];

            setUserPermissions(permissions);

            // Validar acceso básico al panel
            const hasPanelAccess = permissions.includes("view_panel_admin");

            if (hasPanelAccess) {
               setIsAuth(true);
            } else {
               setIsAuth(false);
            }
         } catch (err) {
            console.error("Error en ProtectedRoute:", err);
            setIsAuth(false);
            if (err.message === "Sesión inválida") sessionStorage.clear();
         } finally {
            setLoading(false);
         }
      };

      validarToken();
   }, []);

   if (loading) {
      return (
         <div className="flex items-center justify-center h-screen">
            <LoadingCard text="Validando Sesión" />
         </div>
      );
   }

   if (!isAuth) {
      const token = sessionStorage.getItem("token");

      // Si no hay token → login
      if (!token) {
         return <Navigate to="/login" state={{ from: location }} replace />;
      }

      // Si hay token pero no tiene permiso → home
      return <Navigate to="/" replace />;
   }

   // --- NUEVA VALIDACIÓN DE PERMISOS ESPECÍFICOS Y CONTEXTO ---

   // 1. Validar Contexto (Tenant) para rutas sensibles
   if (permission === 'view_comprobantes' && isAdminContext) {
      console.warn("Acceso denegado: Contexto Admin no puede ver Comprobantes");
      return <Navigate to="/" replace />;
   }

   if (permission === 'view_pagos' && !isAdminContext) {
      console.warn("Acceso denegado: Contexto Cliente no puede ver Pagos");
      return <Navigate to="/" replace />;
   }

   // 2. Validar permiso específico si se requiere
   if (permission && !userPermissions.includes(permission)) {
      console.warn(`Acceso denegado: Falta el permiso ${permission}`);
      return <Navigate to="/" replace />;
   }

   // Pasamos los permisos a los componentes hijos vía props
   return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
         return React.cloneElement(child, { userPermissions });
      }
      return child;
   });
}

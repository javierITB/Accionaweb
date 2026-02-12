import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/api";
import LoadingCard from "./LoadingCard";

export default function ProtectedRoute({ children }) {
   const [loading, setLoading] = useState(true);
   const [isAuth, setIsAuth] = useState(false);
   const [userPermissions, setUserPermissions] = useState([]);
   const location = useLocation();
   const navigate = useNavigate();

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
               headers: { "Authorization": `Bearer ${token}` }
            });

            if (!roleRes.ok) throw new Error("Error verificando permisos del rol");

            const roleData = await roleRes.json();
            const permissions = roleData.permissions || [];

            setUserPermissions(permissions);

            // Verificar acceso al panel de cliente
            const hasAccess = permissions.includes("view_panel_cliente");

            if (hasAccess) {
               setIsAuth(true);
            } else {
               // --- INTEGRACIÓN: Volver a Vista A sin cerrar sesión ---
               alert("No tienes permisos para acceder a esta sección.");
               
               if (window.history.length > 1) {
                  navigate(-1);

               } else {
                 navigate("/")
               }
               
               // No ejecutamos sessionStorage.clear() ni setIsAuth(false) 
               // para que el usuario mantenga su sesión activa en la vista anterior.
            }

         } catch (err) {
            console.error("Error en ProtectedClient:", err);
            // Solo cerramos sesión si el token es realmente inválido (401)
            if (err.message === "Sesión inválida") {
               sessionStorage.clear();
               setIsAuth(false);
            }
         } finally {
            setLoading(false);
         }
      };

      validarToken();
   }, []); // Se mantiene el array de dependencias original

 useEffect(() => {
      const theme = localStorage.getItem("theme");
      if (theme === "dark") {
         document.documentElement.classList.remove("dark");
      }

      return () => {
         if (theme === "dark") {
            document.documentElement.classList.add("dark");
         }
      };
   }, []);
   
   if (loading) {
      return (
         <div className="flex items-center justify-center h-screen">
            <LoadingCard text="Validando Sesión" />
         </div>
      );
   }

   if (!isAuth) {
      return <Navigate to="/login" state={{ from: location }} replace />;
   }

   // Pasamos los permisos a los componentes hijos vía props
   return React.Children.map(children, child => {
      if (React.isValidElement(child)) {
         return React.cloneElement(child, { userPermissions });
      }
      return child;
   });
}
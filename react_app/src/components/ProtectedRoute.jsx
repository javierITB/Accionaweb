import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import LoadingCard from "../clientPages/components/LoadingCard";

export default function ProtectedRoute({ children }) {
   const [loading, setLoading] = useState(true);
   const [isAuth, setIsAuth] = useState(false);
   const location = useLocation();

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

            // Guardar permisos en sessionStorage para uso global (Sidebar, etc.)
            sessionStorage.setItem("permissions", JSON.stringify(permissions));

            const hasAccess = permissions.includes("view_panel_admin") || roleData.name === "Admin";

            if (hasAccess) {
               setIsAuth(true);
            } else {
               alert("No tienes permisos para acceder al panel de administración.");
               window.location.href = "/"; // Redirigir al home público o login
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
            <LoadingCard />
         </div>
      );
   }

   return isAuth ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

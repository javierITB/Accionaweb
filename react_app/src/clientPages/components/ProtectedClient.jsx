import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

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
        const res = await fetch("https://accionaapi.vercel.app/api/auth/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email, cargo }),
        });
        if (cargo == "user" || cargo == "cliente" || cargo == "Admin"){
          setIsAuth(res.ok);
        } else {
          alert("Sesión inactiva o expirada...")
          setIsAuth(false);
        }
      } catch (err) {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    validarToken();
  }, []);

  if (loading) return <p>Cargando...</p>;

  return isAuth ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

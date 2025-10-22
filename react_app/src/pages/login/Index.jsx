"use client";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("https://accionaweb.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res?.ok && data?.success) {
        // Guardamos token en sessionStorage
        setError(data.message || "error");
        sessionStorage.setItem("cargo", data?.usr?.cargo); // solo string
        sessionStorage.setItem("email", data?.usr?.email);
        sessionStorage.setItem("user", data?.usr?.name);
        sessionStorage.setItem("token", data?.token);

        navigate(from, { replace: true });
      } else {
        setError(data.message || "Error de login");
        sessionStorage.clear(); // borramos token por seguridad
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
      sessionStorage.clear(); // borramos token por seguridad
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Email</label>
          <input type="email" className="w-full border p-2 rounded" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Contraseña</label>
          <input type="password" className="w-full border p-2 rounded" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="w-full bg-[#f97316] text-white py-2 rounded font-bold hover:bg-orange-500 transition">
          Ingresar
        </button>
      </form>
    </div>
  );
}

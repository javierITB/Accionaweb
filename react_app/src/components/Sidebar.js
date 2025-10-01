"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState(null); // usuario logueado
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (!storedUser || !token) {
      sessionStorage.clear();
      setUser(null);
      setTokenValid(false);
      return;
    }

    // Validar token con backend
    const email = JSON.parse(storedUser).email;

    fetch("http://localhost:4000/api/auth/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setUser(data.user);
          setTokenValid(true);
        } else {
          sessionStorage.clear();
          setUser(null);
          setTokenValid(false);
        }
      })
      .catch(() => {
        sessionStorage.clear();
        setUser(null);
        setTokenValid(false);
      });
  }, []);

  const handleLogout = () => {
    const token = sessionStorage.getItem("token");
    if (token) {
      fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }
    sessionStorage.clear();
    setUser(null);
    setTokenValid(false);
    router.push("/"); // Redirigir a home
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1d4ed8] text-white h-screen shadow-lg">
      {/* Logo */}
      <div className="h-18 flex items-center justify-center bg-orange-400">
        <Image
          src="/logo.png"
          alt="Logo"
          width={120}
          height={40}
          className="object-contain"
        />
      </div>

      {/* Menú */}
      <ul className="menu p-4 flex-1">
        <li className="hover:bg-blue-800"><Link href="/">🏠 Dashboard</Link></li>
        <li className="hover:bg-blue-800"><Link href="/usuarios">👥 Usuarios</Link></li>
        <li className="hover:bg-blue-800"><Link href="/tareas">✅ Tareas</Link></li>
        <li className="hover:bg-blue-800"><Link href="/reportes">📊 Reportes</Link></li>

        {/* Botón dinámico login/logout */}
        {tokenValid && user ? (
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-left hover:bg-red-800 p-2 rounded mt-4"
            >
              🔒 Cerrar sesión
            </button>
          </li>
        ) : (
          <li>
            <button
              onClick={() => router.push("/login")}
              className="w-full text-left hover:bg-blue-800 p-2 rounded mt-4"
            >
              🔑 Iniciar sesión
            </button>
          </li>
        )}
      </ul>
    </aside>
  );
}

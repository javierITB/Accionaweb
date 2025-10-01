"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const pages = [
  { name: "Usuarios", href: "/usuarios" },
  { name: "Tareas", href: "/tareas" },
  { name: "Reportes", href: "/reportes" },
  { name: "Proyectos", href: "/proyectos" }, // nueva página
  { name: "Login", href: "/login" },
];

  return (
    <div className="navbar bg-[#f97316] text-white px-4 shadow-md">
      {/* Logo */}
      <div className="flex-none">
        <Link href="/" className="text-xl font-bold flex items-center">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto mr-2" />
          AdminPanel
        </Link>
      </div>

      {/* Menú de páginas */}
      <div className="flex-1 hidden md:flex justify-center">
        <ul className="menu menu-horizontal p-0">
          {pages.map((p, i) => (
            <li key={i}>
              <Link href={p.href}>{p.name}</Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón login */}
      <div className="flex-none">
        <Link href="/login" className="btn btn-sm bg-white text-black border-none">
          Login
        </Link>
      </div>

      {/* Botón menú móvil */}
      <div className="flex-none md:hidden ml-2">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="btn btn-sm bg-[#1d4ed8] border-none"
        >
          ☰
        </button>
      </div>

      {/* Dropdown móvil */}
      {menuOpen && (
        <div className="absolute top-14 left-0 w-full bg-[#f97316] text-white flex flex-col md:hidden shadow-md">
          {pages.map((p, i) => (
            <Link key={i} href={p.href} className="p-4 border-b border-orange-300">
              {p.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

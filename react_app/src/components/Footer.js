"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1d4ed8] text-white py-3 ">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={40}
            className="object-contain"
          />
          <span className="text-sm md:text-base font-semibold">
            © {new Date().getFullYear()} Mi Empresa. Todos los derechos reservados.
          </span>
        </div>

        {/* Contacto */}
        <ul className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm">
          <li>
            <Link href="mailto:contacto@miempresa.com" className="hover:underline">
              📧 contacto@miempresa.com
            </Link>
          </li>
          <li>
            <Link href="https://wa.me/56912345678" target="_blank" className="hover:underline">
              💬 WhatsApp
            </Link>
          </li>
          <li>
            <Link href="tel:+56912345678" className="hover:underline">
              📞 +56 9 1234 5678
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

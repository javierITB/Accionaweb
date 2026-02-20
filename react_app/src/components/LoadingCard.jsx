import React, { useState, useEffect } from 'react';
import Header from './ui/Header';
import Sidebar from './ui/Sidebar';
import Icon from "./AppIcon";

export default function LoadingCard({ text = "Cargando...", iconSize = 36, client = true }) {
   // Estados de UI para mantener la consistencia con el layout principal
   const [isDesktopOpen, setIsDesktopOpen] = useState(true);
   const [isMobileOpen, setIsMobileOpen] = useState(false);
   const [isMobileScreen, setIsMobileScreen] = useState(
      typeof window !== 'undefined' ? window.innerWidth < 768 : false
   );

   // --- EFECTOS DE REDIMENSIONAMIENTO ---
   useEffect(() => {
      const handleResize = () => {
         const isMobile = window.innerWidth < 768;
         setIsMobileScreen(isMobile);
         if (isMobile) setIsMobileOpen(false);
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
   }, []);

   const toggleSidebar = () => {
      if (isMobileScreen) setIsMobileOpen(!isMobileOpen);
      else setIsDesktopOpen(!isDesktopOpen);
   };

   // Si es modo cliente (login, etc.), mostramos pantalla completa sin bars
   if (client) {
      return (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4">
            <div className="text-center">
               <Icon name="Loader" size={iconSize} className="animate-spin mx-auto mb-3 text-primary" />
               <p className="text-muted-foreground text-sm sm:text-base font-medium animate-pulse">{text}</p>
            </div>
         </div>
      );
   }

   // Modo integrado con Sidebar y Header (Panel de administración)
   const mainMarginClass = isMobileScreen ? "ml-0" : isDesktopOpen ? "lg:ml-64" : "lg:ml-16";

   return (
      <div className="min-h-screen bg-background">
         <Header />
         
         <Sidebar
            isCollapsed={!isDesktopOpen}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={isMobileOpen}
            onNavigate={() => isMobileScreen && setIsMobileOpen(false)}
         />

         {/* Overlay para móvil cuando el sidebar está abierto */}
         {isMobileScreen && isMobileOpen && (
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)}></div>
         )}

         {/* Contenedor principal que respeta el espacio del Header (pt-24) y Sidebar (mainMarginClass) */}
         <main className={`z-40 transition-all duration-300 ${mainMarginClass} pt-24 lg:pt-20 flex items-center justify-center`} style={{ minHeight: '80vh' }}>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border p-8 sm:p-12 text-center shadow-subtle max-w-sm mx-auto">
               <Icon name="Loader" size={iconSize} className="animate-spin mx-auto mb-4 text-primary" />
               <span className="text-sm sm:text-base font-semibold text-foreground block tracking-tight">
                  {text}
               </span>
               <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest opacity-50">
                  Solunex ACCIONA
               </p>
            </div>
         </main>
      </div>
   );
}
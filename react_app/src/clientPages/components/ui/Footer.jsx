import React, { useState, useEffect } from 'react'
import Icon from '@/components/AppIcon';
import { LOGO_TENANT } from "@/utils/api";

export default function Footer() {
  // --- LÓGICA DINÁMICA DEL LOGO ---
  const [logoSrc, setLogoSrc] = useState(`/logos/${LOGO_TENANT}/logo-header.png`);

  useEffect(() => {
    setLogoSrc(`/logos/${LOGO_TENANT}/logo-header.png`);
  }, [LOGO_TENANT]);

  return (
              <div className="bg-card rounded-xl shadow-brand border border-border p-4 lg:p-6 mt-6 lg:mt-8 w-full">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg overflow-hidden">
            <img
              src={logoSrc}
              alt={`Logo ${LOGO_TENANT}`}
              className="max-w-full max-h-full"
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder-logo.png";
              }}
              loading="lazy"
            />
          </div>
                
                <div>
                  <h4 className="font-semibold text-foreground text-sm lg:text-base capitalize">
                    {LOGO_TENANT === 'api' ? 'Acciona' : LOGO_TENANT} HR Portal
                  </h4>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Tu plataforma integral de recursos humanos
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:flex lg:items-center lg:justify-end lg:space-x-6 text-xs lg:text-sm text-muted-foreground">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Icon name="Shield" size={14} className="lg:w-4 lg:h-4" />
                  <span>Seguro y Confiable</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Icon name="Clock" size={14} className="lg:w-4 lg:h-4" />
                  <span>24/7 Disponible</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Icon name="Users" size={14} className="lg:w-4 lg:h-4" />
                  <span>Soporte Dedicado</span>
                </div>
              </div>
            </div>
            <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date()?.getFullYear()} <span className="capitalize">{LOGO_TENANT === 'api' ? 'Acciona' : LOGO_TENANT}</span>. Todos los derechos reservados. 
                <br className="sm:hidden" />
                Portal desarrollado para mejorar tu experiencia laboral.
              </p>
            </div>
          </div>
  )
}
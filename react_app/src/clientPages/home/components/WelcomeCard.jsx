import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import { apiFetch, API_BASE_URL } from "../../../utils/api";

const WelcomeCard = ({ user }) => {
  const currentHour = new Date().getHours();
  const [companyLogo, setCompanyLogo] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCompanyLogo = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/auth/empresas/logo`);

        if (!res.ok) {
          console.error("Error fetching company logo");
          return;
        }

        const { logo, mimeType } = await res.json();

        if (!cancelled && typeof logo === "string") {
          const cleanBase64 = logo.replace(/^data:[^;]+;base64,/, "");
          setCompanyLogo(`data:${mimeType};base64,${cleanBase64}`);
        }
      } catch (error) {
        console.error("Error obteniendo logo de la empresa:", error);
      }
    };

    fetchCompanyLogo();

    return () => {
      cancelled = true;
    };
  }, []);

  const getGreeting = () => {
    if (currentHour < 12) return "Buenos días";
    if (currentHour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="bg-gradient-to-br from-primary to-success p-4 sm:p-6 rounded-xl text-white shadow-brand-hover w-full">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 muted-foreground break-words">
            {getGreeting()}, {user?.name}
          </h1>

          <p className="text-muted-foreground/80 mb-4 text-sm sm:text-base leading-relaxed">
            Bienvenido a Portal Acciona. Aquí puedes gestionar todas tus solicitudes y documentos de manera eficiente.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2 text-white">
              <Icon name="Calendar" size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">
                {new Date().toLocaleDateString("es-ES", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-white">
              <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
              <span>Sistema activo</span>
            </div>
          </div>
        </div>

        {/* Logo empresa */}
        <div className="ml-4 flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Logo de la empresa"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Icon name="User" size={20} className="sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;

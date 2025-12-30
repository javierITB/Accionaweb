import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const WelcomeCard = ({ user }) => {
  const currentHour = new Date()?.getHours();
  const [companyLogo, setCompanyLogo] = useState(null);
  const userMail = sessionStorage.getItem("email");

  // Obtener el logo de la empresa del usuario
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        if (!userMail) return;

        console.log('Buscando logo para usuario:', userMail);

        // 1. Obtener datos del usuario para saber su empresa
        const userResponse = await fetch(`https://back-acciona.vercel.app/api/auth/full/${userMail}`);
        if (!userResponse.ok) {
          console.log('Error obteniendo datos del usuario');
          return;
        }
        
        const userData = await userResponse.json();
        const userCompany = userData.empresa;
        console.log('Empresa del usuario:', userCompany);

        if (!userCompany) {
          console.log('Usuario no tiene empresa asignada');
          return;
        }

        // 2. Obtener todas las empresas para buscar la del usuario
        const companiesResponse = await fetch(`https://back-acciona.vercel.app/api/auth/empresas/todas`);
        if (!companiesResponse.ok) {
          console.log('Error obteniendo empresas');
          return;
        }
        
        const companies = await companiesResponse.json();
        console.log('Empresas encontradas:', companies.length);
        
        // 3. Buscar la empresa del usuario (búsqueda más flexible)
        const userCompanyData = companies.find(company => {
          const companyName = company.nombre?.toLowerCase().trim();
          const userCompanyName = userCompany?.toLowerCase().trim();
          return companyName === userCompanyName || 
                 companyName?.includes(userCompanyName) ||
                 userCompanyName?.includes(companyName);
        });

        console.log('Empresa encontrada:', userCompanyData);

        if (userCompanyData && userCompanyData.logo) {
          console.log('Logo encontrado:', userCompanyData.logo);
          
          // 4. Verificar la estructura del logo
          if (userCompanyData.logo.fileData) {
            const logoData = userCompanyData.logo.fileData;
            
            // Diferentes formas de manejar el buffer según la estructura
            let base64String;
            
            if (logoData.data) {
              // Si es un objeto con propiedad data (ArrayBuffer)
              base64String = btoa(
                new Uint8Array(logoData.data).reduce(
                  (data, byte) => data + String.fromCharCode(byte), ''
                )
              );
            } else if (logoData.buffer) {
              // Si es un objeto con propiedad buffer
              base64String = btoa(
                new Uint8Array(logoData.buffer).reduce(
                  (data, byte) => data + String.fromCharCode(byte), ''
                )
              );
            } else if (typeof logoData === 'string') {
              // Si ya es un string base64
              base64String = logoData.replace(/^data:[^;]+;base64,/, '');
            } else {
              // Intentar convertir directamente
              try {
                const uint8Array = new Uint8Array(logoData);
                base64String = btoa(
                  uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
              } catch (error) {
                console.error('Error procesando logo:', error);
                return;
              }
            }
            
            const logoUrl = `data:${userCompanyData.logo.mimeType || 'image/png'};base64,${base64String}`;
            console.log('Logo URL generada');
            setCompanyLogo(logoUrl);
          } else {
            console.log('Logo no tiene fileData');
          }
        } else {
          console.log('No se encontró empresa o logo');
        }

      } catch (error) {
        console.error('Error obteniendo logo de la empresa:', error);
      }
    };

    fetchCompanyLogo();
  }, [userMail]);

  const getGreeting = () => {
    if (currentHour < 12) return 'Buenos días';
    if (currentHour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="bg-gradient-to-br from-primary to-success p-4 sm:p-6 rounded-xl text-white shadow-brand-hover w-full">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent overflow */}
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
                {new Date()?.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <div className="w-2 h-2 bg-success rounded-full flex-shrink-0"></div>
              <span>Sistema activo</span>
            </div>
          </div>
        </div>
        
        {/* Logo de empresa - CORREGIDO: Siempre visible pero con tamaño responsive */}
        <div className="ml-4 flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Logo de la empresa"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('Error cargando logo, mostrando icono por defecto');
                  e.target.style.display = 'none';
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
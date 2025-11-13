import React, { useState, useEffect } from 'react';
import Header from '../../clientPages/components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProfileSection from './components/ProfileSection';
import SecuritySettings from './components/SecuritySettings';

const UserProfileSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    {
      id: 'profile',
      label: 'Perfil Personal',
      icon: 'User',
      description: 'Información personal y departamentos'
    },
    {
      id: 'security',
      label: 'Seguridad',
      icon: 'Shield',
      description: 'Contraseña y autenticación'
    },
    {
      id: 'logout',
      label: 'Cerrar Sesión',
      icon: 'LogOut',
      description: 'Cerrar sesión',
      color: "#ffae00"
    },

  ];

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'security':
        return <SecuritySettings />;
      case 'logout':
        handleLogout();
      default:
        return <ProfileSection />;
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`transition-all duration-300 pt-20`}>
        {/* 💡 APLICACIÓN DE LA CLASE CONTAINER-MAIN */}
        <div className="px-20 py-6 space-y-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Configuración de Perfil</h1>
                <p className="text-muted-foreground mt-2">
                  Gestiona tu información personal, preferencias y configuración de seguridad
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  iconName="Download"
                  iconPosition="left"
                >
                  Exportar Datos
                </Button>

                <Button
                  variant="outline"
                  iconName="HelpCircle"
                  iconPosition="left"
                >
                  Ayuda
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border shadow-subtle sticky top-24">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Configuración</h2>

                  <nav className="space-y-2">
                    
                    {tabs?.map((tab) => (
                      <div className="">
                      
                      <button
                        key={tab?.id}
                        onClick={() => handleTabChange(tab?.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-150 hover:bg-muted color-popover-foreground`}
                        style={
                          tab?.color
                            ? {
                              backgroundColor: tab.color // O el color de texto que desees para el fondo oscuro
                            }
                            : {} // No aplicar estilo si no está activo
                        }
                      >
                        <Icon
                          name={tab?.icon}
                          size={18}
                          className={'text-muted-foreground'}
                          
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium 'text-foreground'
                            }`}>
                            {tab?.label}
                          </div>
                          <div className={`text-xs 'text-muted-foreground'
                            }`}>
                            {tab?.description}
                          </div>
                        </div>
                        {activeTab == tab.id && "o"}
                      </button>
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Tab Content */}
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfileSettings;
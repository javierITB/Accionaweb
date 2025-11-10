import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProfileSection from './components/ProfileSection';
import SecuritySettings from './components/SecuritySettings';

const UserProfileSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentLanguage, setCurrentLanguage] = useState('es');

  // Check for saved language preference on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'es';
    setCurrentLanguage(savedLanguage);
  }, []);

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
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'security':
        return <SecuritySettings />;
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
                      <button
                        key={tab?.id}
                        onClick={() => handleTabChange(tab?.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-150 ${activeTab === tab?.id
                            ? 'bg-primary text-primary-foreground shadow-subtle'
                            : 'hover:bg-muted text-foreground'
                          }`}
                      >
                        <Icon
                          name={tab?.icon}
                          size={18}
                          className={activeTab === tab?.id ? 'text-primary-foreground' : 'text-muted-foreground'}
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${activeTab === tab?.id ? 'text-primary-foreground' : 'text-foreground'
                            }`}>
                            {tab?.label}
                          </div>
                          <div className={`text-xs ${activeTab === tab?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}>
                            {tab?.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* User Summary Card */}
                <div className="p-6 border-t border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Icon name="User" size={20} color="white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">María González</h3>
                      <p className="text-xs text-muted-foreground">Supervisora de RRHH</p>
                      <p className="text-xs text-muted-foreground">Última actividad: Hace 5 min</p>
                    </div>
                  </div>
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
import React, { useState, useEffect } from 'react';
import Header from '../../clientPages/components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProfileSection from './components/ProfileSection';
import SecuritySettings from './components/SecuritySettings';

const UserProfileSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    setShowMobileMenu(false); // Cerrar menú móvil al seleccionar pestaña
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        {/* 💡 CONTENEDOR PRINCIPAL RESPONSIVE */}
        <div className="px-4 sm:px-6 lg:px-8 xl:px-20 py-4 lg:py-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
          {/* Page Header - RESPONSIVE */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configuración de Perfil</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  Gestiona tu información personal, preferencias y configuración de seguridad
                </p>
              </div>

            </div>
          </div>

          {/* Mobile Tab Selector - SOLO EN MÓVIL */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-subtle"
              title = "Seleccionar sección de configuración"
            >
              <div className="flex items-center space-x-3">
                <Icon 
                  name={tabs.find(tab => tab.id === activeTab)?.icon || 'User'} 
                  size={20} 
                />
                <span className="font-medium text-foreground">
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Perfil'}
                </span>
              </div>
              <Icon 
                name={showMobileMenu ? "ChevronUp" : "ChevronDown"} 
                size={16} 
                className="text-muted-foreground"
              />
            </button>

            {showMobileMenu && (
              <div className="mt-2 bg-card border border-border rounded-lg shadow-subtle overflow-hidden">
                <nav className="py-2">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => handleTabChange(tab?.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150 hover:bg-muted ${
                        activeTab === tab?.id ? 'bg-muted border-l-2 border-primary' : ''
                      }`}
                      style={
                        tab?.color && activeTab === tab?.id
                          ? { backgroundColor: tab.color }
                          : {}
                      }
                      title = {`Ir a la sección de ${tab?.label}`}
                    >
                      <Icon
                        name={tab?.icon}
                        size={18}
                        className={activeTab === tab?.id ? 'text-primary' : 'text-muted-foreground'}
                      />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          activeTab === tab?.id ? 'text-foreground' : 'text-foreground'
                        }`}>
                          {tab?.label}
                        </div>
                        <div className={`text-xs ${
                          activeTab === tab?.id ? 'text-muted-foreground' : 'text-muted-foreground'
                        }`}>
                          {tab?.description}
                        </div>
                      </div>
                      {activeTab === tab?.id && (
                        <Icon name="Check" size={16} className="text-primary" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Sidebar Navigation - SOLO EN DESKTOP */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-card rounded-lg border border-border shadow-subtle sticky top-24">
                <div className="p-4 lg:p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Configuración</h2>

                  <nav className="space-y-2">
                    {tabs?.map((tab) => (
                      <button
                        key={tab?.id}
                        onClick={() => handleTabChange(tab?.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-150 hover:bg-muted ${
                          activeTab === tab?.id ? 'bg-muted' : ''
                        }`}
                        style={
                          tab?.color && activeTab === tab?.id
                            ? { backgroundColor: tab.color }
                            : {}
                        }
                        title = {`Ir a la sección de ${tab?.label}`}
                      >
                        <Icon
                          name={tab?.icon}
                          size={18}
                          className={activeTab === tab?.id ? 'text-primary' : 'text-muted-foreground'}
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${
                            activeTab === tab?.id ? 'text-foreground' : 'text-foreground'
                          }`}>
                            {tab?.label}
                          </div>
                          <div className={`text-xs ${
                            activeTab === tab?.id ? 'text-muted-foreground' : 'text-muted-foreground'
                          }`}>
                            {tab?.description}
                          </div>
                        </div>
                        {activeTab === tab?.id && (
                          <Icon name="Check" size={16} className="text-primary" />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-4 lg:space-y-6">
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
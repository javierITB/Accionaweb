import React, { useState, useEffect } from 'react';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import Header from '../../clientPages/components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ProfileSection from './components/ProfileSection';
import SecuritySettings from './components/SecuritySettings';
import BackButton from 'clientPages/components/BackButton';

// Función para obtener el email de sesión
const getSessionEmail = () => {
  try {
    return sessionStorage.getItem('email') || null;
  } catch (e) {
    console.error("Error reading session storage:", e);
    return null;
  }
};

const MOCK_SESSION_EMAIL = getSessionEmail() || "mail@mail.com";

const UserProfileSettings = ({ userPermissions = [] }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!userPermissions.includes('view_perfil')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-card rounded-xl shadow-lg border border-border">
          <h2 className="text-xl font-bold text-red-500 mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">No tienes permisos para ver tu perfil.</p>
        </div>
      </div>
    );
  }
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ESTADOS PARA ALMACENAR LOS DATOS DEL USUARIO
  const [userId, setUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // --- NUEVO: EFECTO PARA DESACTIVAR MODO OSCURO DEL ADMIN ---
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    if (hadDark) html.classList.remove('dark');

    return () => {
      if (hadDark) html.classList.add('dark');
    };
  }, []);

  // ----------------------------------------------------------------
  // EFECTO PARA CARGAR DATOS DEL USUARIO
  // ----------------------------------------------------------------
  useEffect(() => {
    const fetchUserProfile = async () => {
      const userEmail = getSessionEmail() || MOCK_SESSION_EMAIL;

      if (!userEmail) {
        setIsLoading(false);
        alert('No se pudo encontrar el email de sesión.');
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiFetch(`${API_BASE_URL}/auth/full/${userEmail}`);

        if (!response.ok) {
          throw new Error('Error al cargar el perfil.');
        }

        const user = await response.json();

        const initialData = {
          firstName: user.nombre || '',
          lastName: user.apellido || '',
          email: user.mail || '',
          position: user.cargo || user.rol || '',
          employeeId: user._id || '',
          department: user.empresa || '',
          rol: user.rol || 'user',
          estado: user.estado || 'activo',
          twoFactorEnabled: user.twoFactorEnabled === true, // 👈 CLAVE
        };

        setUserId(user._id);
        setProfileData(initialData);

      } catch (error) {
        console.error("Error al cargar perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  // FUNCIÓN PARA ACTUALIZAR ESTADO 2FA DESDE SECURITYSETTINGS
  const handleUpdate2FAStatus = (newStatus) => {
    if (profileData) {
      setProfileData(prev => ({
        ...prev,
        twoFactorEnabled: newStatus
      }));
    }
  };


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
    if (isLoading || !profileData) {
      // Usamos colores fijos bg-white y text-slate-500 en lugar de bg-card
      return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-subtle p-8 sm:p-12 text-center text-slate-500">
          <Icon name="Loader" size={24} className="animate-spin mx-auto mb-3 text-primary" />
          <span className="text-sm sm:text-base">Cargando datos del usuario...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return <ProfileSection initialProfileData={profileData} userId={userId} isLoading={isLoading} />;
      case 'security':
        return <SecuritySettings twoFactorEnabled={profileData.twoFactorEnabled} onUpdate2FAStatus={handleUpdate2FAStatus} userEmail={profileData.email} />;
      case 'logout':
        handleLogout();
        return null;
      default:
        return <ProfileSection initialProfileData={profileData} userId={userId} isLoading={isLoading} />;
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    // Cambiado bg-background por bg-[#f8fafc] (slate-50) y forzado light mode
    <div className="min-h-screen bg-[#f8fafc]" style={{ colorScheme: 'light' }}>
      <Header />
      <main className={`transition-all duration-300 pt-16 lg:pt-20`}>
        <div className="px-4 sm:px-6 lg:px-8 xl:px-20 py-4 lg:py-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">

          {/* Page Header */}
          <div className="mb-6 lg:mb-8">
            <div className="button-container pb-3 text-md">
              <BackButton />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="min-w-0 flex-1">
                {/* Cambiado text-foreground por text-slate-900 */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Configuración de Perfil</h1>
                <p className="text-slate-500 mt-2 text-sm sm:text-base">
                  Gestiona tu información personal, preferencias y configuración de seguridad
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Tab Selector */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-subtle"
              title="Seleccionar sección de configuración"
            >
              <div className="flex items-center space-x-3">
                <Icon name={tabs.find(tab => tab.id === activeTab)?.icon || 'User'} size={20} />
                <span className="font-medium text-slate-900">
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Perfil'}
                </span>
              </div>
              <Icon name={showMobileMenu ? "ChevronUp" : "ChevronDown"} size={16} className="text-slate-400" />
            </button>

            {showMobileMenu && (
              <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-subtle overflow-hidden">
                <nav className="py-2">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => handleTabChange(tab?.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150 hover:bg-slate-50 ${activeTab === tab?.id ? 'bg-slate-50 border-l-2 border-primary' : ''}`}
                      style={tab?.color && activeTab === tab?.id ? { backgroundColor: tab.color } : {}}
                      title={`Ir a la sección de ${tab?.label}`}
                    >
                      <Icon name={tab?.icon} size={18} className={activeTab === tab?.id ? 'text-primary' : 'text-slate-400'} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{tab?.label}</div>
                        <div className="text-xs text-slate-500">{tab?.description}</div>
                      </div>
                      {activeTab === tab?.id && <Icon name="Check" size={16} className="text-primary" />}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="hidden lg:block lg:col-span-1">
              {/* Cambiado bg-card por bg-white y border-border por border-slate-200 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-subtle sticky top-24">
                <div className="p-4 lg:p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Configuración</h2>
                  <nav className="space-y-2">
                    {tabs?.map((tab) => (
                      <button
                        key={tab?.id}
                        onClick={() => handleTabChange(tab?.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-150 hover:bg-slate-50 ${activeTab === tab?.id ? 'bg-slate-100' : ''}`}
                        style={tab?.color && activeTab === tab?.id ? { backgroundColor: tab.color } : {}}
                        title={`Ir a la sección de ${tab?.label}`}
                      >
                        <Icon name={tab?.icon} size={18} className={activeTab === tab?.id ? 'text-primary' : 'text-slate-400'} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{tab?.label}</div>
                          <div className="text-xs text-slate-500">{tab?.description}</div>
                        </div>
                        {activeTab === tab?.id && <Icon name="Check" size={16} className="text-primary" />}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="space-y-4 lg:space-y-6">
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
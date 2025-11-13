import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SecuritySettings = () => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mock active sessions data
  const activeSessions = [
    {
      id: 1,
      device: "Chrome en Windows",
      location: "Madrid, España",
      ipAddress: "192.168.1.100",
      lastActive: "Hace 5 minutos",
      isCurrent: true
    },
    {
      id: 2,
      device: "Safari en iPhone",
      location: "Madrid, España", 
      ipAddress: "192.168.1.101",
      lastActive: "Hace 2 horas",
      isCurrent: false
    },
    {
      id: 3,
      device: "Firefox en Ubuntu",
      location: "Barcelona, España",
      ipAddress: "10.0.0.50",
      lastActive: "Hace 1 día",
      isCurrent: false
    }
  ];

  // Mock security events
  const securityEvents = [
    {
      id: 1,
      type: "login",
      description: "Inicio de sesión exitoso",
      timestamp: "07/11/2024 14:30",
      location: "Madrid, España",
      status: "success"
    },
    {
      id: 2,
      type: "password_change",
      description: "Contraseña cambiada",
      timestamp: "05/11/2024 09:15",
      location: "Madrid, España",
      status: "success"
    },
    {
      id: 3,
      type: "failed_login",
      description: "Intento de inicio de sesión fallido",
      timestamp: "03/11/2024 22:45",
      location: "Valencia, España",
      status: "warning"
    }
  ];

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user types
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm?.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es obligatoria';
    }
    
    if (!passwordForm?.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es obligatoria';
    } else if (passwordForm?.newPassword?.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (!passwordForm?.confirmPassword) {
      newErrors.confirmPassword = 'Confirme la nueva contraseña';
    } else if (passwordForm?.newPassword !== passwordForm?.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handlePasswordSubmit = () => {
    if (validatePasswordForm()) {
      setIsChangingPassword(true);
      // Mock password change
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Contraseña cambiada exitosamente');
      }, 2000);
    }
  };

  const handleTwoFactorToggle = () => {
    if (!twoFactorEnabled) {
      setShowQRCode(true);
    } else {
      setTwoFactorEnabled(false);
      setShowQRCode(false);
    }
  };

  const handleTwoFactorVerification = () => {
    if (verificationCode?.length === 6) {
      setTwoFactorEnabled(true);
      setShowQRCode(false);
      setVerificationCode('');
      alert('Autenticación de dos factores activada exitosamente');
    }
  };

  const handleTerminateSession = (sessionId) => {
    // Mock session termination
    alert(`Sesión ${sessionId} terminada`);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'login':
        return 'LogIn';
      case 'password_change':
        return 'Key';
      case 'failed_login':
        return 'AlertTriangle';
      default:
        return 'Activity';
    }
  };

  const getEventColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-emerald-600';
      case 'warning':
        return 'text-amber-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Password Change Section */}
      <div className="bg-card rounded-lg border border-border shadow-subtle">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Key" size={18} className="text-primary sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">
              Cambiar Contraseña (panel en desarrollo, estas funciones se habilitarán pronto)
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="max-w-md space-y-3 sm:space-y-4">
            <Input
              label="Contraseña Actual"
              type="password"
              value={passwordForm?.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e?.target?.value)}
              error={errors?.currentPassword}
              placeholder="Ingrese su contraseña actual"
              required
            />

            <Input
              label="Nueva Contraseña"
              type="password"
              value={passwordForm?.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e?.target?.value)}
              error={errors?.newPassword}
              placeholder="Mínimo 8 caracteres"
              required
            />

            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              value={passwordForm?.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e?.target?.value)}
              error={errors?.confirmPassword}
              placeholder="Repita la nueva contraseña"
              required
            />

            <Button
              variant="default"
              onClick={handlePasswordSubmit}
              loading={isChangingPassword}
              iconName="Save"
              iconPosition="left"
              className="mt-3 sm:mt-4 w-full sm:w-auto"
            >
              Cambiar Contraseña
            </Button>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Icon name="Shield" size={14} className="text-blue-600 mt-0.5 flex-shrink-0 sm:w-4 sm:h-4" />
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-blue-900">Consejos de seguridad</h4>
                <ul className="text-xs text-blue-800 mt-2 space-y-1">
                  <li>• Use al menos 8 caracteres con mayúsculas, minúsculas y números</li>
                  <li>• Evite usar información personal como fechas de nacimiento</li>
                  <li>• No reutilice contraseñas de otras cuentas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-card rounded-lg border border-border shadow-subtle">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Smartphone" size={18} className="text-primary sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Autenticación de Dos Factores</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
            <div className="min-w-0">
              <h3 className="text-base font-medium text-foreground">
                Autenticación 2FA {twoFactorEnabled ? 'Activada' : 'Desactivada'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Añade una capa extra de seguridad a tu cuenta
              </p>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {twoFactorEnabled && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full whitespace-nowrap">
                  Activa
                </span>
              )}
              <Button
                variant={twoFactorEnabled ? "destructive" : "default"}
                onClick={handleTwoFactorToggle}
                size="sm"
              >
                {twoFactorEnabled ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          </div>

          {showQRCode && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-border rounded-lg">
              <h4 className="text-sm font-medium text-foreground mb-3">
                Configurar Autenticación de Dos Factores
              </h4>
              
              <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                    1. Escanea este código QR con tu aplicación de autenticación
                  </p>
                  <div className="w-40 h-40 sm:w-48 sm:h-48 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center mx-auto">
                    <div className="text-center">
                      <Icon name="QrCode" size={32} className="text-muted-foreground mx-auto mb-2 sm:w-12 sm:h-12" />
                      <p className="text-xs text-muted-foreground">Código QR</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
                    2. Ingresa el código de 6 dígitos de tu aplicación
                  </p>
                  <Input
                    label="Código de Verificación"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e?.target?.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                  <Button
                    variant="default"
                    onClick={handleTwoFactorVerification}
                    disabled={verificationCode?.length !== 6}
                    className="mt-3 sm:mt-4 w-full sm:w-auto"
                  >
                    Verificar y Activar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-card rounded-lg border border-border shadow-subtle">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Monitor" size={18} className="text-primary sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Sesiones Activas</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {activeSessions?.map((session) => (
              <div key={session?.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-border rounded-lg space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Monitor" size={16} className="text-muted-foreground sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-2 space-y-1 xs:space-y-0">
                      <h4 className="text-sm font-medium text-foreground break-words">{session?.device}</h4>
                      {session?.isCurrent && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full whitespace-nowrap self-start">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{session?.location}</p>
                    <p className="text-xs text-muted-foreground">IP: {session?.ipAddress}</p>
                  </div>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between sm:justify-end sm:flex-col sm:items-end space-y-1 xs:space-y-0 xs:space-x-2 sm:space-x-0 sm:space-y-2">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{session?.lastActive}</p>
                  {!session?.isCurrent && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleTerminateSession(session?.id)}
                      className="w-full xs:w-auto sm:w-full"
                    >
                      Terminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Events */}
      <div className="bg-card rounded-lg border border-border shadow-subtle">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Activity" size={18} className="text-primary sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Actividad de Seguridad</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            {securityEvents?.map((event) => (
              <div key={event?.id} className="flex items-center space-x-3 sm:space-x-4 p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors">
                <Icon 
                  name={getEventIcon(event?.type)} 
                  size={14} 
                  className={`${getEventColor(event?.status)} flex-shrink-0 sm:w-4 sm:h-4`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground break-words">{event?.description}</p>
                  <p className="text-xs text-muted-foreground">{event?.location}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{event?.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
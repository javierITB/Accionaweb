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
  const [apiMessage, setApiMessage] = useState(null); // Para mostrar mensajes de éxito/error del server

  // Modificación: showQRCode ahora es un estado de la fase de activación
  const [twoFAStage, setTwoFAStage] = useState('initial'); // 'initial', 'code_sent', 'disabled'
  // ...
  const [isSendingCode, setIsSendingCode] = useState(false); // Para el spinner del botón Activar
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
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
    // ... otros mocks se mantienen igual
  ];

  // Mock security events se mantiene igual...
  const securityEvents = [
    {
      id: 1,
      type: "login",
      description: "Inicio de sesión exitoso",
      timestamp: "07/11/2024 14:30",
      location: "Madrid, España",
      status: "success"
    }
    // ...
  ];

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user types
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (apiMessage) setApiMessage(null);
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

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setApiMessage(null);

    try {
      // 1. Obtener datos de sesión
      // Asumimos que guardaste el usuario como string JSON en 'usr' o similar al hacer login
      // Si guardaste solo el token, necesitarás decodificarlo o tener el email guardado aparte.
      // Ajusta la clave 'user_data' o 'usr' según como lo guardes en el login.
      const userEmail = sessionStorage.getItem('email') || "";
      const token = sessionStorage.getItem('token'); // Asumiendo que el token se llama 'token'


      if (!userEmail) {
        throw new Error("No se pudo identificar al usuario (Email no encontrado en sesión)");
      }

      // 2. Llamada a la API
      const response = await fetch('https://back-acciona.vercel.app/api/auth/change-password', { // Ajusta tu URL base si es necesario
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Enviar token si tienes middleware de auth
        },
        body: JSON.stringify({
          email: userEmail,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Éxito
        setApiMessage({ type: 'success', text: data.message });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        // Error controlado desde backend (ej: contraseña actual mal)
        setApiMessage({ type: 'error', text: data.message || 'Error al cambiar la contraseña' });
      }

    } catch (error) {
      console.error("Error changing password:", error);
      setApiMessage({ type: 'error', text: 'Error de conexión o sesión inválida' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ... Resto de funciones (handleTwoFactorToggle, etc) se mantienen igual

  const handleTwoFactorToggle = async () => {
    // 1. DESACTIVAR
    if (twoFactorEnabled) {
      if (!window.confirm("¿Seguro que deseas desactivar la Autenticación de Dos Factores?")) return;
      // Lógica de Desactivación (similar a la activación, pero enviando código de desactivación o pidiendo la contraseña actual)
      // Por simplicidad, aquí solo haré el cambio de estado simulado, pero debería ser una llamada a API real:
      setTwoFactorEnabled(false);
      setTwoFAStage('initial');
      setApiMessage({ type: 'success', text: '2FA desactivada (simulado).' });
      return;
    }

    // 2. ACTIVAR: PASO 1 - SOLICITAR CÓDIGO POR EMAIL
    setIsSendingCode(true);
    setApiMessage(null);
    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('email'); // Opcional, si tu API lo necesita

    try {
      const response = await fetch('https://back-acciona.vercel.app/api/auth/send-2fa-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: userEmail }) // Si el backend necesita el email
      });

      const data = await response.json();

      if (data.success) {
        // Éxito: El código ha sido enviado
        setTwoFAStage('code_sent');
        setApiMessage({ type: 'success', text: data.message });
      } else {
        setApiMessage({ type: 'error', text: data.message || 'Error al enviar el código 2FA.' });
      }
    } catch (error) {
      console.error("Error al enviar código 2FA:", error);
      setApiMessage({ type: 'error', text: 'Error de conexión o sesión inválida al iniciar 2FA.' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleTwoFactorVerification = async () => {
    if (verificationCode?.length !== 6) return;

    // PASO 2 - VERIFICAR CÓDIGO Y ACTIVAR 2FA
    setIsVerifyingCode(true);
    setApiMessage(null);
    const token = sessionStorage.getItem('token');
    // Es mejor usar el ID del token, pero aquí simulamos pasando el email
    const userId = sessionStorage.getItem('userId');

    try {
      const response = await fetch('https://back-acciona.vercel.app/api/auth/verify-2fa-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          verificationCode: verificationCode,
          // Reemplazar con el ID del usuario real si tu backend lo necesita
          userId: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Éxito: El servidor actualizó el estado del usuario
        setTwoFactorEnabled(true);
        setTwoFAStage('initial'); // Vuelve al estado inicial, pero ahora como activado
        setVerificationCode('');
        setApiMessage({ type: 'success', text: data.message });
      } else {
        // Error: Código incorrecto o expirado
        setApiMessage({ type: 'error', text: data.message || 'Código de verificación inválido o expirado.' });
      }
    } catch (error) {
      console.error("Error al verificar código 2FA:", error);
      setApiMessage({ type: 'error', text: 'Error de conexión al verificar 2FA.' });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleTerminateSession = (sessionId) => {
    alert(`Sesión ${sessionId} terminada`);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'login': return 'LogIn';
      case 'password_change': return 'Key';
      case 'failed_login': return 'AlertTriangle';
      default: return 'Activity';
    }
  };

  const getEventColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-red-600';
      default: return 'text-muted-foreground';
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
              Cambiar Contraseña
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="max-w-md space-y-3 sm:space-y-4">

            {/* Mensajes de feedback de la API */}
            {apiMessage && (
              <div className={`p-3 rounded-md text-sm ${apiMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                {apiMessage.text}
              </div>
            )}

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

      {/* Two-Factor Authentication (Sin cambios lógicos profundos, solo UI) */}
      <div className="bg-card rounded-lg border border-border shadow-subtle">
        {/* ... (código existente del 2FA) ... */}
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

            {/* BOTÓN DE ACTIVACIÓN/DESACTIVACIÓN */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {twoFactorEnabled && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full whitespace-nowrap">
                  Activa
                </span>
              )}

              {/* Si 2FA no está activa, y no hemos enviado código, mostramos el botón ACTIVA */}
              {twoFAStage === 'initial' && !twoFactorEnabled && (
                <Button
                  variant="default"
                  onClick={handleTwoFactorToggle}
                  size="sm"
                  loading={isSendingCode}
                >
                  Activar 2FA
                </Button>
              )}

              {/* Si 2FA está activa, mostramos el botón DESACTIVAR */}
              {twoFactorEnabled && (
                <Button
                  variant="destructive"
                  onClick={handleTwoFactorToggle}
                  size="sm"
                >
                  Desactivar
                </Button>
              )}

            </div>
          </div>
          {(twoFAStage === 'code_sent') && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-border rounded-lg bg-yellow-50">

              <div className="flex items-start space-x-3 mb-4">
                <Icon name="Mail" size={18} className="text-amber-600 flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-foreground">
                    Código Enviado
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Hemos enviado un código de 6 dígitos a tu correo electrónico. Ingresa el código a continuación para finalizar la activación de 2FA.
                  </p>
                </div>
              </div>

              <div className="max-w-xs mx-auto">
                <Input
                  label="Código de Verificación (6 dígitos)"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e?.target?.value)}
                  placeholder="123456"
                  maxLength={6}
                />
                <Button
                  variant="default"
                  onClick={handleTwoFactorVerification}
                  loading={isVerifyingCode}
                  disabled={verificationCode?.length !== 6 || isVerifyingCode}
                  className="mt-3 sm:mt-4 w-full"
                >
                  Verificar y Activar 2FA
                </Button>

                <Button
                  variant="link"
                  onClick={() => setTwoFAStage('initial')}
                  disabled={isVerifyingCode}
                  className="mt-2 w-full text-sm text-muted-foreground"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {(twoFAStage !== 'initial' && twoFAStage !== 'code_sent') && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Proceso en curso...</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};

export default SecuritySettings;
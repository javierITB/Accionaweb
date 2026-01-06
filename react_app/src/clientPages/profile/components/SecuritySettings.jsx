import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { API_BASE_URL } from '../../../utils/api';

// Aceptamos las props pasadas desde UserProfileSettings
const SecuritySettings = ({ twoFactorEnabled, onUpdate2FAStatus, userEmail }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Eliminamos el estado local de twoFactorEnabled y lo controlamos por props.
  // const [twoFactorEnabled, setTwoFactorEnabled] = useState(twoFactorEnabledProp); 

  // ESTADO PARA CONTROLAR LAS FASES DE ACTIVACIÓN 2FA POR EMAIL
  const [twoFAStage, setTwoFAStage] = useState(twoFactorEnabled ? 'active' : 'initial'); // 'initial', 'code_sent', 'active'

  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [apiMessage, setApiMessage] = useState(null); // Para mostrar mensajes de éxito/error del server
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);


  // Mock active sessions data y security events se mantienen igual...

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

  // ... (validatePasswordForm y handlePasswordSubmit se mantienen igual) ...

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
      const token = sessionStorage.getItem('token');


      if (!userEmail) {
        throw new Error("No se pudo identificar al usuario (Email no encontrado en sesión)");
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: userEmail, // Usamos la prop
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setApiMessage({ type: 'success', text: data.message });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setApiMessage({ type: 'error', text: data.message || 'Error al cambiar la contraseña' });
      }

    } catch (error) {
      console.error("Error changing password:", error);
      setApiMessage({ type: 'error', text: 'Error de conexión o sesión inválida' });
    } finally {
      setIsChangingPassword(false);
    }
  };


  // ----------------------------------------------------------------
  // LÓGICA DE ACTIVACIÓN / DESACTIVACIÓN 2FA
  // ----------------------------------------------------------------
  const handleTwoFactorToggle = async () => {
    // 1. DESACTIVAR 2FA
    if (twoFactorEnabled) {
      if (!window.confirm("¿Seguro que deseas desactivar la Autenticación de Dos Factores?")) return;

      setIsDisabling2FA(true);
      setApiMessage(null);

      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/disable-2fa`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: userEmail })
        });
        const data = await response.json();

        if (data.success) {
          onUpdate2FAStatus(false); // 🔑 Actualizar el estado en el componente padre
          setTwoFAStage('initial');
          setApiMessage({ type: 'success', text: data.message || '2FA desactivada correctamente.' });
        } else {
          setApiMessage({ type: 'error', text: data.message || 'No se pudo desactivar 2FA.' });
        }
      } catch (err) {
        console.error("Error al desactivar 2FA:", err);
        setApiMessage({ type: 'error', text: 'Error de red al desactivar 2FA.' });
      } finally {
        setIsDisabling2FA(false);
      }
      return;
    }

    // 2. ACTIVAR 2FA: PASO 1 - SOLICITAR CÓDIGO POR EMAIL
    setIsSendingCode(true);
    setApiMessage(null);
    const token = sessionStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-2fa-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: userEmail })
      });

      const data = await response.json();

      if (data.success) {
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

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-2fa-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          verificationCode: verificationCode,
          email: userEmail // Usamos el email como identificador único
        })
      });

      const data = await response.json();

      if (data.success) {
        // Éxito: El servidor actualizó el estado del usuario
        onUpdate2FAStatus(true); // 🔑 Actualizar el estado en el componente padre
        setTwoFAStage('active'); // Mostrar estado activo
        setVerificationCode('');
        setApiMessage({ type: 'success', text: data.message });
      } else {
        setApiMessage({ type: 'error', text: data.message || 'Código de verificación inválido o expirado.' });
      }
    } catch (error) {
      setApiMessage({ type: 'error', text: 'Error de red al verificar el código.' });
    } finally {
      setIsVerifyingCode(false);
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Password Change Section (Se mantiene igual) */}
      {/* ... */}
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

      {/* Two-Factor Authentication SECTION - CLAVE */}
      <div className="bg-card rounded-lg border border-border shadow-subtle">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Icon name="Smartphone" size={18} className="text-primary sm:w-5 sm:h-5" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Autenticación de Dos Factores (2FA)</h2>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
            <div className="min-w-0">
              <h3 className="text-base font-medium text-foreground">
                2FA {twoFactorEnabled ? 'Activada' : 'Desactivada'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Añade una capa extra de seguridad a tu cuenta mediante código por correo.
              </p>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {twoFactorEnabled && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full whitespace-nowrap">
                  Activa
                </span>
              )}
              {twoFAStage !== 'code_sent' && (
                <Button
                  variant="default"
                  onClick={handleTwoFactorToggle}
                  size="sm"
                  loading={isSendingCode || isDisabling2FA}
                >
                  {twoFactorEnabled ? 'Desactivar' : 'Activar 2FA'}
                </Button>
              )}
            </div>
          </div>

          {/* SECCIÓN DE VERIFICACIÓN DE CÓDIGO POR EMAIL */}
          {twoFAStage === 'code_sent' && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 border border-border rounded-lg bg-yellow-50">

              <div className="flex items-start space-x-3 mb-4">
                <Icon name="Mail" size={18} className="text-amber-600 flex-shrink-0 mt-1" />
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-foreground">
                    Código de Activación Enviado
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Hemos enviado un código de 6 dígitos al correo <strong className="font-semibold">{userEmail}</strong>. Ingrésalo a continuación para finalizar la activación.
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
                  Verificar y Activar
                </Button>

                <Button
                  variant="link"
                  onClick={() => setTwoFAStage('initial')} // Permite al usuario cancelar el proceso
                  disabled={isVerifyingCode}
                  className="mt-2 w-full text-sm text-muted-foreground"
                >
                  Cancelar Activación
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SecuritySettings;
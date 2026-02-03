import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Loader, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { API_BASE_URL } from "../../../utils/api";

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');

  // --- DEFINICIÓN DE COLOR PARA ESTÉTICA NUEVA ---
  const ORANGE_COLOR = '#f97316';

  // --- ESTADOS ORIGINALES RECUPERADOS AL 100% ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  // --- FUNCIÓN DE VALIDACIÓN ORIGINAL (Recuperada íntegramente) ---
  const validatePassword = (pass) => {
    if (pass.length === 0) {
      setPasswordStrength('');
      return true;
    }

    if (pass.length < 8) {
      setPasswordStrength('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    // Validar que tenga al menos una letra y un número
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);

    if (!hasLetter || !hasNumber) {
      setPasswordStrength('La contraseña debe incluir letras y números');
      return false;
    }

    setPasswordStrength('Contraseña segura');
    return true;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  // --- MANEJO DE ENVÍO ORIGINAL (Lógica exacta y completa) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Enlace inválido');
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar fortaleza de la contraseña
    if (!validatePassword(password)) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al establecer la contraseña');
      }

      alert('Contraseña establecida exitosamente. Ya puedes iniciar sesión.');
      window.location.href = '/login';

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);

      // ✅ Recuperada la lógica de redirección automática si ya fue establecida
      if (error.message.includes("ya fue establecida") || error.message.includes("Ya fue configurada")) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCIÓN DE COLOR ORIGINAL ---
  const getStrengthColor = () => {
    if (!passwordStrength) return 'text-gray-400';
    if (passwordStrength === 'Contraseña segura') return 'text-green-500';
    return 'text-red-500';
  };

  // --- VISTA DE ERROR ORIGINAL (Visualmente actualizada) ---
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-red-600">Enlace Inválido</h2>
          <p className="text-gray-600">El enlace para establecer la contraseña no es válido.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="mt-4 w-full bg-[#f97316] text-white py-3 rounded-xl font-bold hover:bg-orange-500 transition shadow-lg"
            title="Ir al Login"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Establecer Contraseña</h2>
          <p className="text-sm text-gray-500">Configura tu nueva clave de acceso</p>
        </div>

        {/* Mensajes de Error con lógica de redirección recuperada */}
        {error && (
          <div className="mb-4">
            <p className="text-red-500 text-center text-sm font-medium">{error}</p>
            {(error.includes("ya fue establecida") || error.includes("Ya fue configurada")) && (
              <p className="text-blue-500 text-sm text-center mt-2 animate-pulse">
                Serás redirigido al login en 3 segundos...
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo Contraseña */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm
                  ${isLoading ? 'bg-gray-50' : 'focus:ring-2'}`}
                style={!isLoading ? { focusRingColor: ORANGE_COLOR } : {}}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Ingresa tu contraseña"
                required
                disabled={isLoading}
              />
            </div>
            {passwordStrength && (
              <p className={`text-sm mt-1 flex items-center gap-1 font-medium ${getStrengthColor()}`}>
                {passwordStrength === 'Contraseña segura' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {passwordStrength}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres, debe incluir letras y números
            </p>
          </div>

          {/* Campo Confirmar Contraseña */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm
                  ${isLoading ? 'bg-gray-50' : 'focus:ring-2'}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                disabled={isLoading}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center bg-[#f97316] text-white py-3 rounded-xl font-bold hover:bg-orange-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || passwordStrength !== 'Contraseña segura' || password !== confirmPassword}
            title="Establecer Contraseña"
          >
            {isLoading ? (
              <><Loader className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
            ) : (
              'Guardar Contraseña'
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              title="Ir al Login"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
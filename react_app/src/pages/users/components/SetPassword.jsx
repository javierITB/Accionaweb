import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  // Función para validar la fortaleza de la contraseña
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
      const response = await fetch(`https://accionaapi.vercel.app/api/auth/set-password`, {
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
      
      // ✅ Si ya tiene contraseña, redirigir al login después de 3 segundos
      if (error.message.includes("ya fue establecida") || error.message.includes("Ya fue configurada")) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para determinar el color del indicador de fortaleza
  const getStrengthColor = () => {
    if (!passwordStrength) return 'text-gray-400';
    if (passwordStrength === 'Contraseña segura') return 'text-green-500';
    return 'text-red-500';
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Enlace Inválido</h2>
          <p className="text-gray-600">El enlace para establecer la contraseña no es válido.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 w-full bg-[#f97316] text-white py-2 rounded font-bold hover:bg-orange-500 transition"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Establecer Contraseña</h2>
        
        {error && (
          <div className="mb-4">
            <p className="text-red-500 text-center">{error}</p>
            {(error.includes("ya fue establecida") || error.includes("Ya fue configurada")) && (
              <p className="text-blue-500 text-sm text-center mt-2">
                Serás redirigido al login en 3 segundos...
              </p>
            )}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Contraseña</label>
          <input 
            type="password" 
            className="w-full border p-2 rounded" 
            value={password} 
            onChange={handlePasswordChange} 
            placeholder="Ingresa tu contraseña"
            required 
            disabled={isLoading}
          />
          {passwordStrength && (
            <p className={`text-sm mt-1 ${getStrengthColor()}`}>
              {passwordStrength}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 8 caracteres, debe incluir letras y números
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Confirmar Contraseña</label>
          <input 
            type="password" 
            className="w-full border p-2 rounded" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            placeholder="Repite tu contraseña"
            required 
            disabled={isLoading}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              Las contraseñas no coinciden
            </p>
          )}
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-[#f97316] text-white py-2 rounded font-bold hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || passwordStrength !== 'Contraseña segura' || password !== confirmPassword}
        >
          {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
        </button>

        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => window.location.href = '/login'}
            className="text-blue-500 hover:text-blue-700"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetPassword;
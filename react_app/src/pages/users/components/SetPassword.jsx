import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userId) {
      setError('Enlace inválido');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://192.168.0.2:4000/api/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al establecer la contraseña');
      }

      alert('Contraseña establecida exitosamente. Ya puedes iniciar sesión.');
      window.location.href = '/login';

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Enlace Inválido</h2>
          <p className="text-gray-600">El enlace para establecer la contraseña no es válido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Establecer Contraseña</h2>
        
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Contraseña</label>
          <input 
            type="password" 
            className="w-full border p-2 rounded" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Ingresa tu contraseña"
            required 
          />
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
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-[#f97316] text-white py-2 rounded font-bold hover:bg-orange-500 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
        </button>
      </form>
    </div>
  );
};

export default SetPassword;
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Enlace inválido');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres');
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
        throw new Error('Error al establecer la contraseña');
      }

      alert('Contraseña establecida exitosamente. Ya puedes iniciar sesión.');
      window.location.href = '/login'; // Redirigir al login

    } catch (error) {
      console.error('Error:', error);
      alert('Error al establecer la contraseña: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Enlace inválido</h1>
          <p className="text-muted-foreground mt-2">El enlace para establecer la contraseña no es válido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-md mx-auto mt-16 p-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Establecer Contraseña</h1>
            <p className="text-muted-foreground mb-6">
              Crea una contraseña para tu cuenta
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                Guardar Contraseña
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SetPassword;
import React, { useState } from 'react';
// IMPORTACIONES REALES: Necesitas tener 'react-router-dom' instalado
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader } from 'lucide-react';

// NOTA IMPORTANTE: Para que la navegación funcione, este componente debe
// estar envuelto en un componente <BrowserRouter> (o equivalente) en tu aplicación.
// Si tu entorno no soporta 'react-router-dom' directamente, la función 'navigate'
// no realizará la redirección visual, aunque la lógica del login será correcta.

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const ORANGE_COLOR = '#f97316'; // Color semi-anaranjado

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://back-acciona.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        // Almacenamiento de tokens (manteniendo la lógica original)
        sessionStorage.setItem("cargo", data?.usr?.cargo);
        sessionStorage.setItem("email", data?.usr?.email);
        sessionStorage.setItem("user", data?.usr?.name);
        sessionStorage.setItem("token", data?.token);

        // REDIRECCIÓN REAL: Llama a la función navigate importada
        navigate(from, { replace: true });
      } else {
        setError(data.message || "Error de inicio de sesión. Por favor, verifica tus credenciales.");
        sessionStorage.clear(); // Borramos token por seguridad
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor. Inténtalo de nuevo más tarde.");
      sessionStorage.clear(); // Borramos token por seguridad
    } finally {
      setLoading(false);
    }
  };

  return (
    // Fondo gris claro, centrado
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Tarjeta con bordes redondeados (rounded-xl) y sombra profunda (shadow-xl) */}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Bienvenido de nuevo a tu plataforma Acciona
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mensaje de Error estilizado */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Campo Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm
                  focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nombre@ejemplo.com"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm
                  focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Ingresa tu contraseña"
              />
            </div>
          </div>

          {/* Enlace de Olvidó Contraseña con color naranja */}
          <div className="text-right">
            <a 
              href="/recuperacion" 
              className={`text-sm font-medium text-[${ORANGE_COLOR}] hover:text-orange-500 transition duration-150`}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón de Submit con color naranja */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white 
              bg-[${ORANGE_COLOR}] hover:bg-orange-500 transition duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
            title="Iniciar sesión"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-3 animate-spin" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
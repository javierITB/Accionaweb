import React, { useState } from 'react';
// IMPORTACIONES REALES: Necesitas tener 'react-router-dom' instalado
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader, Shield } from 'lucide-react';

// NOTA IMPORTANTE: Para que la navegación funcione, este componente debe
// estar envuelto en un componente <BrowserRouter> (o equivalente) en tu aplicación.
// Si tu entorno no soporta 'react-router-dom' directamente, la función 'navigate'
// no realizará la redirección visual, aunque la lógica del login será correcta.



export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState(""); // Nuevo estado para el código 2FA
  const [view, setView] = useState('login'); // 'login' o '2fa'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const ORANGE_COLOR = '#f97316'; // Color semi-anaranjado

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://back-desa.vercel.app/api/auth/verify-login-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email, // Usamos el email guardado del primer paso
          verificationCode: twoFACode
        }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        // LOGIN FINALIZADO EXITOSAMENTE
        sessionStorage.setItem("cargo", data?.usr?.cargo);
        sessionStorage.setItem("email", data?.usr?.email);
        sessionStorage.setItem("user", data?.usr?.name);
        sessionStorage.setItem("token", data?.token);

        navigate(from, { replace: true });
      } else {
        setError(data.message || "Código 2FA incorrecto o expirado.");
      }

    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://back-desa.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {

        if (data?.twoFA) {
          // PASO 1 COMPLETO: Requerir 2FA
          setError(""); // Limpiamos errores anteriores si los hay
          setView('2fa'); // Cambiamos la vista
          // El backend ya envió el código al correo

        } else {
          // LOGIN DIRECTO (2FA NO ACTIVA)
          sessionStorage.setItem("cargo", data?.usr?.cargo);
          sessionStorage.setItem("email", data?.usr?.email);
          sessionStorage.setItem("user", data?.usr?.name);
          sessionStorage.setItem("token", data?.token);

          navigate(from, { replace: true });
        }

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
            {view === 'login' ? 'Iniciar Sesión' : 'Verificación 2FA'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {view === 'login'
              ? 'Bienvenido de nuevo a tu plataforma Acciona'
              : `Ingresa el código enviado a ${email}`}
          </p>
        </div>
        {error && (
          <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VISTA 1: FORMULARIO DE LOGIN (DEFAULT) */}
        {/* ----------------------------------------------------- */}
        {view === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-6">

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

            {/* Enlace de Olvidó Contraseña */}
            <div className="text-right">
              <a
                href="/recuperacion"
                className={`text-sm font-medium text-[${ORANGE_COLOR}] hover:text-orange-500 transition duration-150`}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Botón de Submit */}
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
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------- */}
        {/* VISTA 2: FORMULARIO DE CÓDIGO 2FA */}
        {/* ----------------------------------------------------- */}
        {view === '2fa' && (
          <form onSubmit={handle2FASubmit} className="space-y-6">

            {/* Mensaje de éxito de envío de código - CAMBIADO A NARANJA */}
            <div className={`p-3 bg-orange-50 border border-orange-300 text-orange-700 rounded-xl text-sm font-medium flex items-center space-x-2`}>
              <Shield className="w-5 h-5 flex-shrink-0 text-orange-600" />
              <span>Se requiere un código de verificación. Revisa la bandeja de entrada de <strong className="font-semibold">{email}</strong>.</span>
            </div>

            {/* Campo Código 2FA */}
            <div>
              <label htmlFor="twoFACode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Autenticación
              </label>
              <div className="relative">
                <input
                  id="twoFACode"
                  type="text"
                  inputMode="numeric"
                  className={`w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl text-center transition duration-150 shadow-sm text-lg font-bold tracking-widest
                              focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`} // <-- USANDO ORANGE_COLOR
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  maxLength={6}
                  required
                  placeholder="Ingrese 6 dígitos"
                />
              </div>
            </div>

            {/* Botón de Submit 2FA - CAMBIADO A NARANJA */}
            <button
              type="submit"
              disabled={loading || twoFACode.length !== 6}
              className={`w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white 
                      bg-[${ORANGE_COLOR}] hover:bg-orange-500 transition duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
              title="Verificar código"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-3 animate-spin" />
                  Verificando Código...
                </>
              ) : (
                'Verificar Acceso'
              )}
            </button>

            {/* Opción de volver */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setView('login'); setError(''); setTwoFACode(''); setLoading(false); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition duration-150"
                disabled={loading}
              >
                Volver a Credenciales
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
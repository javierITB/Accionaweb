import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader, Shield, Clock } from 'lucide-react'; // Añadido Clock
import { apiFetch, API_BASE_URL } from '../../utils/api';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [view, setView] = useState('login');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA EL BLOQUEO ---
  const [lockoutTime, setLockoutTime] = useState(0); // Segundos restantes
  const [isLocked, setIsLocked] = useState(false);

  const from = location.state?.from?.pathname || "/";
  const ORANGE_COLOR = '#f97316';

  // --- LÓGICA DE PERSISTENCIA DE INTENTOS ---
  useEffect(() => {

    // RECUPERAR ERROR: Si existe un mensaje guardado, lo ponemos en el estado
    const savedError = localStorage.getItem('pendingLoginError');
    if (savedError) {
      setError(savedError);
      localStorage.removeItem('pendingLoginError');
    }

    const checkLockout = () => {
      const savedLockoutUntil = localStorage.getItem('lockoutUntil');
      if (savedLockoutUntil) {
        const remaining = Math.ceil((parseInt(savedLockoutUntil) - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutTime(remaining);
          setIsLocked(true);
        } else {
          localStorage.removeItem('lockoutUntil');
          setIsLocked(false);
        }
      }
    };

    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  const registerFailedAttempt = () => {
    const attempts = parseInt(localStorage.getItem('loginAttempts') || "0") + 1;
    localStorage.setItem('loginAttempts', attempts.toString());

    if (attempts >= 3) {
      // Cálculo de delay: 30 segundos base, aumenta exponencialmente tras el 3er intento
      // Intento 3: 30s, Intento 4: 60s, Intento 5: 120s...
      const exponent = attempts - 3;
      const delaySeconds = 30 * Math.pow(2, exponent);
      const lockoutUntil = Date.now() + delaySeconds * 1000;
      
      localStorage.setItem('lockoutUntil', lockoutUntil.toString());
      setLockoutTime(delaySeconds);
      setIsLocked(true);
    }
  };

  const resetAttempts = () => {
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutUntil');
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/verify-login-2fa`, {
        method: "POST",
        body: JSON.stringify({
          email: email,
          verificationCode: twoFACode
        }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        resetAttempts(); // Login exitoso, limpiamos contador
        sessionStorage.setItem("rol", data?.usr?.rol);
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
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        if (data?.twoFA) {
          setView('2fa');
        } else {
          resetAttempts(); // Login exitoso directo
          sessionStorage.setItem("rol", data?.usr?.rol);
          sessionStorage.setItem("cargo", data?.usr?.cargo);
          sessionStorage.setItem("email", data?.usr?.email);
          sessionStorage.setItem("user", data?.usr?.name);
          sessionStorage.setItem("token", data?.token);
          navigate(from, { replace: true });
        }
      } else {
        registerFailedAttempt(); 
        const msg = data.message || "Credenciales incorrectas.";
        
        // Guardamos el mensaje antes de que clear() reinicie la app
        localStorage.setItem('pendingLoginError', msg);
        setError(msg);
        
        sessionStorage.clear();
      }
    } catch (err) {
      console.error(err);
      const msg = "Error de conexión con el servidor.";
      
      localStorage.setItem('pendingLoginError', msg);
      setError(msg);
      
      sessionStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
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

        {/* Mensaje de Bloqueo Temporal */}
        {isLocked && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-sm flex items-center space-x-3">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
            <div>
              <p className="font-bold">Acceso restringido temporalmente</p>
              <p>Demasiados intentos fallidos. Intenta de nuevo en <strong>{lockoutTime}s</strong>.</p>
            </div>
          </div>
        )}

        {error && !isLocked && (
          <div className="p-3 mb-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  disabled={isLocked}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm
                          ${isLocked ? 'bg-gray-100 cursor-not-allowed' : `focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nombre@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  disabled={isLocked}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm
                          ${isLocked ? 'bg-gray-100 cursor-not-allowed' : `focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Ingresa tu contraseña"
                />
              </div>
            </div>

            <div className="text-right">
              <a href="/recuperacion" className="text-sm font-medium text-orange-600 hover:text-orange-500 transition duration-150">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className={`w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white 
                  bg-[${ORANGE_COLOR}] hover:bg-orange-500 transition duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-3 animate-spin" />
                  Verificando...
                </>
              ) : isLocked ? (
                'Bloqueado'
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        )}

        {view === '2fa' && (
          <form onSubmit={handle2FASubmit} className="space-y-6">
            <div className="p-3 bg-orange-50 border border-orange-300 text-orange-700 rounded-xl text-sm font-medium flex items-center space-x-2">
              <Shield className="w-5 h-5 flex-shrink-0 text-orange-600" />
              <span>Se requiere un código. Revisa <strong className="font-semibold">{email}</strong>.</span>
            </div>

            <div>
              <label htmlFor="twoFACode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Autenticación
              </label>
              <input
                id="twoFACode"
                type="text"
                inputMode="numeric"
                className={`w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl text-center transition duration-150 shadow-sm text-lg font-bold tracking-widest
                            focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                maxLength={6}
                required
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading || twoFACode.length !== 6}
              className={`w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white 
                      bg-[${ORANGE_COLOR}] hover:bg-orange-500 transition duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <><Loader className="w-5 h-5 mr-3 animate-spin" /> Verificando...</>
              ) : (
                'Verificar Acceso'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setView('login'); setError(''); setTwoFACode(''); setLoading(false); }}
                className="text-sm text-gray-500 hover:text-gray-700"
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
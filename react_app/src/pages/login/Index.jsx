import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader, Shield, Clock, AlertTriangle } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [view, setView] = useState('login');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const from = location.state?.from?.pathname || "/";
  const ORANGE_COLOR = '#f97316';


  useEffect(() => {
    if (!blockTime) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((blockTime - Date.now()) / 1000);
      if (remaining <= 0) {
        setIsBlocked(false);
        setBlockTime(null);
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockTime]);

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    
    if (isBlocked && countdown > 0) {
      const minutes = Math.ceil(countdown / 60);
      setError(`Cuenta bloqueada. Espere ${minutes} minutos.`);
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://back-vercel-iota.vercel.app/api/auth/verify-login-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          verificationCode: twoFACode
        }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        // LOGIN FINALIZADO EXITOSAMENTE
        setIsBlocked(false);
        setBlockTime(null);
        setCountdown(0);
        
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
    
    // Verificar si está bloqueado localmente
    if (isBlocked && countdown > 0) {
      const minutes = Math.ceil(countdown / 60);
      setError(`Cuenta bloqueada temporalmente. Espere ${minutes} minutos.`);
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://back-vercel-iota.vercel.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        if (data?.twoFA) {
          // PASO 1 COMPLETO: Requerir 2FA
          setIsBlocked(false);
          setBlockTime(null);
          setCountdown(0);
          
          setError("");
          setView('2fa');
        } else {
          // LOGIN DIRECTO (2FA NO ACTIVA)
          setIsBlocked(false);
          setBlockTime(null);
          setCountdown(0);
          
          sessionStorage.setItem("cargo", data?.usr?.cargo);
          sessionStorage.setItem("email", data?.usr?.email);
          sessionStorage.setItem("user", data?.usr?.name);
          sessionStorage.setItem("token", data?.token);

          navigate(from, { replace: true });
        }

      } else {
        // CORRECCIÓN EXACTA: Usar SOLO el backend
        if (data?.bloqueado && data?.bloqueadoHasta) {
          const until = new Date(data.bloqueadoHasta).getTime();
          setIsBlocked(true);
          setBlockTime(until);
          setError(data.message);
          return;
        }

        // Si no está bloqueado, mostrar mensaje del backend
        setError(data.message || "Credenciales inválidas.");
        
        sessionStorage.clear();
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor. Inténtalo de nuevo más tarde.");
      sessionStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  // Componente para mostrar estado de bloqueo
  const BlockedWarning = () => {
    if (!isBlocked || countdown <= 0) return null;
    
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };
    
    return (
      <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-xl text-sm font-medium flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-bold">Cuenta temporalmente bloqueada</p>
          <p className="text-xs mt-1 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Tiempo restante: {formatTime(countdown)}
          </p>
        </div>
      </div>
    );
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
        
        {/* Mostrar advertencia de bloqueo */}
        {view === 'login' && <BlockedWarning />}
        
        {error && !isBlocked && (
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
                        disabled={isBlocked && countdown > 0}
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
                        disabled={isBlocked && countdown > 0}
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
                disabled={loading || (isBlocked && countdown > 0)}
                className={`w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white 
                  ${(isBlocked && countdown > 0) ? 'bg-gray-400 cursor-not-allowed' : `bg-[${ORANGE_COLOR}] hover:bg-orange-500`} 
                  transition duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
                title={(isBlocked && countdown > 0) ? "Cuenta bloqueada temporalmente" : "Iniciar sesión"}
            >
                {loading ? (
                    <>
                        <Loader className="w-5 h-5 mr-3 animate-spin" />
                        Verificando...
                    </>
                ) : (isBlocked && countdown > 0) ? (
                    'Cuenta Bloqueada'
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
                
                {/* Mensaje de éxito de envío de código */}
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
                              focus:ring-2 focus:ring-[${ORANGE_COLOR}] focus:border-[${ORANGE_COLOR}]`}
                            value={twoFACode}
                            onChange={(e) => setTwoFACode(e.target.value)}
                            maxLength={6}
                            required
                            placeholder="Ingrese 6 dígitos"
                            disabled={isBlocked && countdown > 0}
                        />
                    </div>
                </div>

                {/* Botón de Submit 2FA */}
                <button 
                    type="submit" 
                    disabled={loading || twoFACode.length !== 6 || (isBlocked && countdown > 0)}
                    className={`w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white 
                      ${(isBlocked && countdown > 0) ? 'bg-gray-400 cursor-not-allowed' : `bg-[${ORANGE_COLOR}] hover:bg-orange-500`} 
                      transition duration-150 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed`}
                    title={(isBlocked && countdown > 0) ? "Cuenta bloqueada temporalmente" : "Verificar código"}
                >
                    {loading ? (
                        <>
                            <Loader className="w-5 h-5 mr-3 animate-spin" />
                            Verificando Código...
                        </>
                    ) : (isBlocked && countdown > 0) ? (
                        'Cuenta Bloqueada'
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
                        disabled={loading || (isBlocked && countdown > 0)}
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
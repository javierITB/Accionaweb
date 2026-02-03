import React, { useState } from "react";
// IMPORTACIONES REALES: Necesitas tener 'react-router-dom' instalado
import { useNavigate } from "react-router-dom";
import { Mail, Loader, CheckCircle, XCircle, KeyRound, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../../utils/api";
import { maskEmail } from "../../utils/maskEmail";

// Endpoints de la API
const API_URL_EMAIL = `${API_BASE_URL}/auth/recuperacion`;
const API_URL_CODE = `${API_BASE_URL}/auth/borrarpass`;

// Componente principal
const App = () => {
   const navigate = useNavigate();

   // Estados del formulario
   const [email, setEmail] = useState("");
   const [code, setCode] = useState("");

   // Control de estado y pasos
   const [step, setStep] = useState(1); // 1: Email, 2: Código, 3: Éxito/Error
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState("");
   const [isSuccess, setIsSuccess] = useState(false);
   const [password, setPassword] = useState({ first: "", confirm: "" });

   const ORANGE_COLOR = "#f97316"; // Color semi-anaranjado

   // Estilos de foco basados en el color naranja
   const inputFocusClasses = "focus:ring-2 focus:ring-orange-500 focus:border-orange-300";
   const buttonClasses = `
  w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white
  bg-orange-500 hover:bg-orange-600 transition duration-150 shadow-lg
  disabled:opacity-70 disabled:hover:bg-orange-500
`;

   // --- Lógica para el Paso 1: Ingreso de Email ---
   const handleEmailSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage("");

      try {
         const response = await fetch(API_URL_EMAIL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
         });

         if (response.status === 200) {
            // Éxito: Mover al paso 2 y mostrar mensaje
            setStep(2);
            setMessage("Se ha enviado un código de verificación al correo electrónico");
         } else {
            // Error en la petición de email
            const errorData = await response.json().catch(() => ({ message: "Error desconocido." }));
            setMessage(errorData.message || "Error al enviar la solicitud. Verifica el correo.");
            setIsSuccess(false);
            setStep(3); // Mostrar pantalla de error
         }
      } catch (error) {
         console.error("API Call Error (Email):", error);
         setMessage("Hubo un problema de conexión. Inténtalo más tarde.");
         setIsSuccess(false);
         setStep(3); // Mostrar pantalla de error
      } finally {
         setLoading(false);
      }
   };

   const canChangePassword = (passwordFirst, passwordConfirm) => {
      if (code?.length !== 6) {
         return {
            ok: false,
            message: "Código de verificación incorrecto o expirado",
         };
      }

      if (passwordFirst.length === 0) {
         return {
            ok: false,
            message: "La contraseña es obligatoria",
         };
      }
      if (passwordFirst?.length < 8) {
         return {
            ok: false,
            message: "La contraseña debe tener al menos 8 caracteres",
         };
      }
      const hasLetter = /[a-zA-Z]/.test(passwordFirst);
      const hasNumber = /[0-9]/.test(passwordFirst);

      if (!hasLetter || !hasNumber) {
         return {
            ok: false,
            message: "La contraseña debe incluir letras y números",
         };
      }

      if (passwordFirst !== passwordConfirm) {
         return {
            ok: false,
            message: "Las contraseñas no coinciden",
         };
      }

      return { ok: true };
   };
   // --- Lógica para el Paso 2: Ingreso de Código ---
   const handleCodeSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage("");
      const passwordFirst = password?.first;
      const passwordConfirm = password?.confirm;

      const result = canChangePassword(passwordFirst, passwordConfirm);

      if (!result.ok) {
         setLoading(false);
         setMessage(result.message);
         return;
      }

      const requestBody = {
         email,
         code,
         password: passwordFirst,
      };

      console.log(requestBody);

      try {
         const response = await fetch(API_URL_CODE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Enviar el email y el código de verificación
            body: JSON.stringify(requestBody),
         });

         const data = await response.json();

         if (response.ok && data?.uid) {
            // Éxito: Redirigir al componente de establecer nueva contraseña
            setIsSuccess(true);
            setStep(3);
            setTimeout(() => {
               navigate("/login", { replace: true });
            }, 1500);
         } else {
            // Error en la verificación del código
            setMessage(data.message || "Código de verificación incorrecto o expirado.");
            setIsSuccess(false);
            setStep(3); // Mostrar pantalla de error
         }
      } catch (error) {
         console.error("API Call Error (Code):", error);
         setMessage("Hubo un problema de conexión al verificar el código.");
         setIsSuccess(false);
         setStep(3); // Mostrar pantalla de error
      } finally {
         setLoading(false);
      }
   };

   // Función para resetear el estado y volver al paso 1
   const resetForm = () => {
      setEmail("");
      setCode("");
      setPassword({ first: "", confirm: "" });
      setStep(1);
      setMessage("");
      setIsSuccess(false);
   };

   // --- Renderizado Condicional por Paso ---

   // Paso 1: Ingreso de Email
   const renderEmailStep = () => (
      <form onSubmit={handleEmailSubmit} className="space-y-6">
         <p className="mt-2 text-sm text-gray-500 text-center">
            Ingresa tu correo electrónico para recibir el código de verificación.
         </p>
         <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
               Correo Electrónico
            </label>
            <div className="relative">
               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm ${inputFocusClasses}`}
                  placeholder="nombre@ejemplo.com"
                  disabled={loading}
               />
            </div>
         </div>
         <button type="submit" disabled={loading} className={buttonClasses} title="Enviar código de recuperación">
            {loading ? (
               <>
                  <Loader className="w-5 h-5 mr-3 animate-spin" />
                  Solicitando Código...
               </>
            ) : (
               "Enviar Código"
            )}
         </button>
      </form>
   );

   const passwordValidation = step === 2 ? canChangePassword(password?.first, password?.confirm) : { ok: false };
   // Paso 2: Ingreso de Código
   const renderCodeStep = () => (
      <form onSubmit={handleCodeSubmit} className="space-y-6" autoComplete="off">
         <div className="p-3 bg-green-50 border border-green-300 text-green-700 rounded-xl text-sm font-medium">
            {message + ": " + maskEmail(email)}
         </div>

         <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
               Código de Verificación
            </label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm ${inputFocusClasses} text-center text-xl tracking-widest`}
                  placeholder="------"
                  maxLength="6"
                  disabled={loading}
                  name="code"
                  autoComplete="new-password"
               />
            </div>
         </div>
         <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
               Nueva Contraseña
            </label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                  id="new-password"
                  type="password"
                  required
                  value={password?.first}
                  onChange={(e) => setPassword((prev) => ({ ...prev, first: e.target.value }))}
                  // onChange={(e) => setCode(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm ${inputFocusClasses} text-left text-xl tracking-widest`}
                  placeholder=""
                  disabled={loading}
                  name="new-password"
                  autoComplete="new-password"
               />
            </div>
         </div>
         <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-700 mb-2">
               Confirmar Contraseña
            </label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input
                  id="password-confirm"
                  type="password"
                  required
                  value={password?.confirm}
                  onChange={(e) => setPassword((prev) => ({ ...prev, confirm: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl transition duration-150 shadow-sm ${inputFocusClasses} text-left text-xl tracking-widest`}
                  placeholder=""
                  disabled={loading}
                  name="new-password-confirm"
                  autoComplete="new-password"
               />
            </div>
         </div>

         <button
            type="submit"
            disabled={loading || !passwordValidation.ok}
            className={buttonClasses}
            title="Cambiar Contraseña"
         >
            {loading ? (
               <>
                  <Loader className="w-5 h-5 mr-3 animate-spin" />
                  Cambiando Contraseña...
               </>
            ) : (
               "Cambiar Contraseña"
            )}
         </button>
         <div className="text-center mt-4">
            <a
               href="#"
               onClick={resetForm}
               className={`text-sm font-medium text-gray-500 hover:text-[${ORANGE_COLOR}] transition duration-150`}
            >
               Solicitar un nuevo código
            </a>
         </div>
      </form>
   );

   // Paso 3: Mensaje de Éxito o Error
   const renderMessageStep = () => {
      const statusColor = isSuccess
         ? "text-green-600 border-green-200 bg-green-50"
         : "text-red-600 border-red-200 bg-red-50";

      // Si es éxito, el componente se habrá redirigido (navigate).
      // Esta pantalla solo se muestra en caso de error en el paso 1 o 2.
      const title = isSuccess ? "Redireccionando..." : "Error";

      return (
         <div className="text-center p-6 space-y-4">
            <div className={`p-4 rounded-xl border-2 ${statusColor}`}>
               {isSuccess ? (
                  <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
               ) : (
                  <XCircle className="w-8 h-8 mx-auto text-red-500" />
               )}
               <p className="mt-3 font-medium">{message}</p>
            </div>
            {!isSuccess ? (
               <button
                  onClick={resetForm}
                  className={`w-full flex items-center justify-center p-3 text-sm font-semibold rounded-xl text-white 
              bg-[${ORANGE_COLOR}] hover:bg-orange-500 transition duration-150 shadow-md`}
               >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Intentar
               </button>
            ) : (
               // vista Contraseña Reiniciada con éxito
               <span className="text-center foreground-success pt-3"> Contraseña reiniciada con éxito. </span>
            )}
         </div>
      );
   };

   return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 font-sans">
         <div className="w-full max-w-md bg-white px-8 py-5 rounded-xl shadow-xl">
            <div className="text-center mb-8">
               <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recuperar Contraseña</h1>
            </div>

            {step === 1 && renderEmailStep()}
            {step === 2 && renderCodeStep()}
            {step === 3 && renderMessageStep()}

            {/* Solo mostrar enlace a Login en los pasos de formulario */}
            {(step === 1 || step === 2) && (
               <div className="mt-6 text-center text-sm">
                  <p className="text-gray-500">
                     <a href="/" className={`font-medium text-[${ORANGE_COLOR}] hover:text-orange-500`}>
                        Volver al inicio de sesión
                     </a>
                  </p>
               </div>
            )}
         </div>
      </div>
   );
};

export default App;

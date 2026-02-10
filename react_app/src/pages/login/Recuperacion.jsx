import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader, CheckCircle, XCircle, KeyRound, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "../../utils/api";
import { maskEmail } from "../../utils/maskEmail";

const API_URL_EMAIL = `${API_BASE_URL}/auth/recuperacion`;
const API_URL_CODE = `${API_BASE_URL}/auth/borrarpass`;

const App = () => {
   const navigate = useNavigate();

   const [email, setEmail] = useState("");
   const [code, setCode] = useState("");
   const [password, setPassword] = useState({ first: "", confirm: "" });

   const [step, setStep] = useState(1);
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState("");
   const [isSuccess, setIsSuccess] = useState(false);
   const [touched, setTouched] = useState({
      passwordConfirm: false,
   });

   const [errors, setErrors] = useState({});

   const ORANGE_COLOR = "#f97316";
   const inputFocusClasses = "focus:ring-2 focus:ring-orange-500 focus:border-orange-300";
   const buttonClasses = `
      w-full flex items-center justify-center p-3 text-lg font-semibold rounded-xl text-white
      bg-orange-500 hover:bg-orange-600 transition duration-150 shadow-lg
      disabled:opacity-70 disabled:hover:bg-orange-500
   `;

   /* =========================
      VALIDACIONES
   ========================= */

   const validateEmail = (v) => {
      if (!v) return "El correo es obligatorio";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de correo inválido";
      return "";
   };

   const validateCode = (v) => {
      if (!v) return "El código es obligatorio";
      if (!/^\d{6}$/.test(v)) return "El código debe tener 6 dígitos";
      return "";
   };

   const validatePassword = (v) => {
      if (!v) return "La contraseña es obligatoria";
      if (v.length < 8) return "Debe tener al menos 8 caracteres";
      return "";
   };

   const validatePasswordConfirm = (v, first) => {
      if (!v) return "Debes confirmar la contraseña";
      if (v !== first) return "Las contraseñas no coinciden";
      return "";
   };

   const setError = (field, value) => {
      setErrors((prev) => ({ ...prev, [field]: value }));
   };

   /* =========================
      PASO 1 - EMAIL
   ========================= */

   const handleEmailChange = (value) => {
      setEmail(value);
      setError("email", validateEmail(value));
   };

   const handleEmailSubmit = async (e) => {
      e.preventDefault();
      const error = validateEmail(email);
      if (error) return setError("email", error);

      setLoading(true);
      setMessage("");

      try {
         const res = await fetch(API_URL_EMAIL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
         });

         if (res.status === 200) {
            setStep(2);
            setMessage("Se ha enviado un código de verificación al correo electrónico");
         } else {
            const data = await res.json().catch(() => ({}));
            setMessage(data.message || "Error al enviar solicitud");
            setStep(3);
         }
      } catch {
         setMessage("Error de conexión");
         setStep(3);
      } finally {
         setLoading(false);
      }
   };

   /* =========================
      PASO 2 - CÓDIGO
   ========================= */

   const handleCodeSubmit = async (e) => {
      e.preventDefault();

      const newErrors = {
         code: validateCode(code),
         password: validatePassword(password.first),
         passwordConfirm: validatePasswordConfirm(password.confirm, password.first),
      };

      setErrors(newErrors);

      if (Object.values(newErrors).some(Boolean)) return;

      setLoading(true);

      try {
         const res = await fetch(API_URL_CODE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               email,
               code,
               password: password.first,
            }),
         });

         const data = await res.json();

         if (res.ok && data?.uid) {
            setIsSuccess(true);
            setStep(3);
            setTimeout(() => navigate("/login", { replace: true }), 1500);
         } else {
            setMessage(data.message || "Código inválido");
            setStep(3);
         }
      } catch {
         setMessage("Error de conexión");
         setStep(3);
      } finally {
         setLoading(false);
      }
   };

   const resetForm = () => {
      setEmail("");
      setCode("");
      setPassword({ first: "", confirm: "" });
      setErrors({});
      setStep(1);
      setMessage("");
      setIsSuccess(false);
   };

   /* =========================
      RENDER
   ========================= */

   const renderEmailStep = () => (
      <form onSubmit={handleEmailSubmit} className="space-y-8">
         <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
         <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
               value={email}
               onChange={(e) => handleEmailChange(e.target.value)}
               onBlur={() => setError("email", validateEmail(email))}
               className={`w-full pl-10 pr-4 py-3 rounded-xl border
    ${errors.email ? "border-red-400" : "border-gray-300"}
    ${inputFocusClasses}`}
               placeholder="nombre@ejemplo.com"
            />

            {errors.email && <p className="absolute left-2 text-sm text-red-600 pt-[5px]">{errors.email}</p>}
         </div>

         <button disabled={loading || !!errors.email} className={buttonClasses}>
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Enviar Código"}
         </button>
      </form>
   );

   const renderCodeStep = () => (
      <form onSubmit={handleCodeSubmit} className="space-y-8" autoComplete="off">
         <div className="p-3 bg-green-50 border border-green-300 rounded-xl text-sm">
            {message + ": " + maskEmail(email)}
         </div>
         <div className="relative">
            <input
               type="text"
               value={code}
               maxLength={6}
               onChange={(e) => {
                  setCode(e.target.value);
                  setError("code", validateCode(e.target.value));
               }}
               className={`w-full py-3 text-center text-xl rounded-xl border
               ${errors.code ? "border-red-400" : "border-gray-300"}
               ${inputFocusClasses}`}
               placeholder="------"
               autoComplete="new-password"
            />
            <p className="absolute left-2 text-sm text-red-600 pt-[5px]">{errors.code || " "}</p>
         </div>
         <div className="relative">
            <input
               type="password"
               value={password.first}
               onChange={(e) => {
                  const v = e.target.value;
                  setPassword((p) => ({ ...p, first: v }));
                  setError("password", validatePassword(v));
                  if (touched.passwordConfirm) {
                     setError("passwordConfirm", validatePasswordConfirm(password.confirm, v));
                  }
               }}
               className={`w-full py-3 rounded-xl border
               ${errors.password ? "border-red-400" : "border-gray-300"}
               ${inputFocusClasses}`}
               placeholder="Nueva contraseña"
               autoComplete="new-password"
            />
            <p className="absolute left-2 text-sm text-red-600 pt-[5px]">{errors.password || " "}</p>
         </div>

         <div className="relative">
            <input
               type="password"
               value={password.confirm}
               onChange={(e) => {
                  const v = e.target.value;
                  setPassword((p) => ({ ...p, confirm: v }));

                  if (!touched.passwordConfirm) {
                     setTouched((t) => ({ ...t, passwordConfirm: true }));
                  }

                  setError("passwordConfirm", validatePasswordConfirm(v, password.first));
               }}
               className={`w-full py-3 rounded-xl border
               ${errors.passwordConfirm ? "border-red-400" : "border-gray-300"}
               ${inputFocusClasses}`}
               placeholder="Confirmar contraseña"
               autoComplete="new-password"
            />
            <p className="absolute left-2 text-sm text-red-600 pt-[5px]">{errors.passwordConfirm || " "}</p>
         </div>

         <button disabled={loading || Object.values(errors).some(Boolean)} className={buttonClasses}>
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Cambiar Contraseña"}
         </button>

         <div className="text-center">
            <button type="button" onClick={resetForm} className="text-sm text-gray-500">
               Solicitar un nuevo código
            </button>
         </div>
      </form>
   );

   const renderMessageStep = () => (
      <div className="text-center space-y-4">
         {isSuccess ? (
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
         ) : (
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
         )}
         <p>{message}</p>
         {!isSuccess && (
            <button onClick={resetForm} className={buttonClasses}>
               <ArrowLeft className="w-4 h-4 mr-2" />
               Volver
            </button>
         )}
      </div>
   );

   return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-2">
         <div className="w-full max-w-md bg-white px-8 pb-8 rounded-xl shadow-xl">
            <h1 className="text-3xl font-bold text-center pb-4 pt-5">Recuperar Contraseña</h1>
            {step === 1 && renderEmailStep()}
            {step === 2 && renderCodeStep()}
            {step === 3 && renderMessageStep()}
         </div>
      </div>
   );
};

export default App;

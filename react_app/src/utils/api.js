/**
 * Para poder autenticas las api requests
 */

// VARIABLE DE CONTROL: Cámbiala manualmente para testear logos localmente.
// En producción déjala vacía "" para que el front use el subdominio.
const domain_temporal = "";

const getSubdomain = () => {
    if (typeof window === 'undefined') return "api";

    const hostname = window.location.hostname; // ej: acciona.solunex.cl
    const parts = hostname.split('.');

    // Si tiene más de 2 partes (subdominio.dominio.ext), tomamos la primera
    // Si es localhost o una IP, devolvemos "api" por defecto para desarrollo
    if (parts.length > 2) {
        return parts[0]; 
    }

    return "api"; // Fallback para solunex.cl o localhost
};

const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    return headers;
};

const tenant = getSubdomain();
const BASE_DOMAIN = "https://back-desa.vercel.app";

// Exportamos el tenant por si lo necesitas en otros componentes (como el login)
export const CURRENT_TENANT = tenant;

// --- LÓGICA PARA ELEGIR CARPETA DE LOGOS EN EL FRONT ---
const aliasAcciona = ["solunex", "infoacciona", "aacciona, infodesa"];

// 1. Decidimos qué nombre evaluar (el temporal o el de la URL)
const nombreAEvaluar = (domain_temporal && domain_temporal !== "") ? domain_temporal : tenant;

// 2. Evaluamos si ese nombre es un alias de acciona para elegir la carpeta correcta
export const LOGO_TENANT = aliasAcciona.includes(nombreAEvaluar.toLowerCase()) 
    ? "acciona" 
    : nombreAEvaluar;
// -------------------------------------------------------

export const API_BASE_URL = `${BASE_DOMAIN}/${tenant}`;

export const apiFetch = async (endpoint, options = {}) => {
    // Si el endpoint ya es una URL completa, la usamos. 
    // Si no, le anteponemos nuestra BASE_URL dinámica.
    const fullUrl = endpoint.startsWith('http')
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
        ...getAuthHeaders(),
        ...options.headers
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(fullUrl, config); // Usamos fullUrl aquí

        if (response.status === 401) {
            console.warn("Unauthorized access - Redirecting...");
            if (typeof window !== 'undefined') {
                sessionStorage.clear();
                window.location.href = '/login';
            }
        }

        return response;
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};

/**
 * Para poder autenticar las api requests
 */

// VARIABLE DE CONTROL: Cámbiala manualmente para testear logos localmente.
// En producción déjala vacía "" para que el front use el subdominio.

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

// 1. Identificador real para la API y Textos (en local será "api")
export const CURRENT_TENANT = tenant;

// 2. Base de la URL para las peticiones al backend
export const API_BASE_URL = `${BASE_DOMAIN}/${tenant}`;

// --- LÓGICA DE MARCA (LOGOS) ---
// Agregamos "api" a los alias para que en localhost cargue la carpeta de acciona
const aliasAcciona = ["solunex", "infoacciona", "acciona", "infodesa", "api"];

export const LOGO_TENANT = aliasAcciona.includes(tenant.toLowerCase())
    ? "acciona"
    : tenant;
// -------------------------------

export const apiFetch = async (endpoint, options = {}) => {
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
        const response = await fetch(fullUrl, config);

        if (response.status === 401 && !options.skipRedirect) {
            console.warn("Unauthorized access - Redirecting...");
            if (typeof window !== 'undefined') {
                sessionStorage.clear();
                window.location.href = '/login';
            }
        }
        if (response.status === 403 && !options.skipRedirect) {
            console.warn("Acceso denegado - Volviendo a la ruta anterior");
            if (typeof window !== 'undefined') {
                window.history.back();
            }
            return response;
        }

        return response;
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};
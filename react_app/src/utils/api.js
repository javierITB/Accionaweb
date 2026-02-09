/**
 * Para poder autenticas las api requests
 */
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

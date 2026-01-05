/**
 * Para poder autenticas las api requests
 */

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

export const apiFetch = async (url, options = {}) => {
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
        const response = await fetch(url, config);

        if (response.status === 401) {
            console.warn("Unauthorized access - Token might be invalid or expired. Redirecting to login...");
            if (typeof window !== 'undefined') {
                sessionStorage.clear();
                // Opcional: Guardar la URL actual para redirigir después del login (si se implementa)
                // sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                window.location.href = '/login';
            }
        }

        return response;
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};

export const API_BASE_URL = "https://back-desa.vercel.app/api";

/**
 * Para poder autenticas las api requests
 */

const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
            console.warn("Unauthorized access - Token might be invalid or expired");
        }

        return response;
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
};

export const API_BASE_URL = "https://back-desa.vercel.app/api";

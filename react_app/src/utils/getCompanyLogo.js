import { API_BASE_URL, apiFetch } from "./api.js";

let cachedLogo = null;
let inFlightPromise = null;

export async function getCompanyLogo(signal) {
   if (cachedLogo) return cachedLogo;

   if (!inFlightPromise) {
      inFlightPromise = apiFetch(`${API_BASE_URL}/auth/empresas/logo`, { signal })
         .then((res) => {
            if (!res.ok) throw new Error("Error logo");
            return res.json();
         })
         .then(({ logo, mimeType }) => {
            cachedLogo = `data:${mimeType};base64,${logo}`;
            return cachedLogo;
         })
         .finally(() => {
            inFlightPromise = null;
         });
   }

   return inFlightPromise;
}

export function clearCompanyLogoCache() {
   cachedLogo = null;
}

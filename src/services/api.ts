import { createApiClient, type TokenStorage } from '@dash4/shared'

/**
 * Client de l'API Dash4 (paquet @dash4/shared). La maquette ne fait que LIRE : elle n'appelle aucune
 * création ni modification, et le compte « Lecture seule » de l'API refuse de toute façon toute écriture.
 */
const TOKEN_KEY = 'dash4demo.token'

export const tokenStorage: TokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  },
}

let unauthorizedHandler: () => void = () => {}
export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

export const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.dash4.yonkou.info/api' : 'http://localhost:8000/api')

export const api = createApiClient({
  baseUrl: API_URL,
  storage: tokenStorage,
  onUnauthorized: () => unauthorizedHandler(),
})

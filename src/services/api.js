// Configuración de la API
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// MODO MOCK: Se puede desactivar mediante variables de entorno o lógicamente
const IS_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true'

async function request(path, options = {}) {
  if (IS_MOCK) {
    console.warn(`[API MOCK] Intento de acceso a ${path}. Todas las peticiones están bloqueadas.`)
    return { success: false, message: 'La aplicación está en modo Mock 100%.' }
  }

  try {
    const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    return await response.json()
  } catch (error) {
    console.error(`[API ERROR] Error en petición a ${path}:`, error)
    return { success: false, message: 'Error de conexión con el servidor.' }
  }
}

export const apiGet = (path) => request(path)
export const apiPost = (path, body) => request(path, { method: 'POST', body })
export const apiPut = (path, body) => request(path, { method: 'PUT', body })
export const apiDelete = (path) => request(path, { method: 'DELETE' })
export const apiPatch = (path, body) => request(path, { method: 'PATCH', body })

export const apiUploadFile = (path) => request(path)
export const mediaUrl = (relativePath) => relativePath

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
  uploadFile: apiUploadFile,
  mediaUrl
}

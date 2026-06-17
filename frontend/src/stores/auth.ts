import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface JwtPayload {
  sub: number
  document: string
  iat: number
  exp: number
}

function decodeJwt(token: string): JwtPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))

  const payload = computed<JwtPayload | null>(() => {
    if (!token.value) return null
    try { return decodeJwt(token.value) } catch { return null }
  })

  const isAuthenticated = computed(() => !!token.value)
  const clientId = computed(() => payload.value?.sub ?? null)
  const clientDocument = computed(() => payload.value?.document?? null)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function logout() {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isAuthenticated, clientId, clientDocument, setToken, logout }
})

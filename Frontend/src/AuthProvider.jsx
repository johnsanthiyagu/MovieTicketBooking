import { useMemo, useState } from 'react'
import { api } from './api'
import { AuthContext } from './auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lumiere-user')
      return saved ? JSON.parse(saved) : null
    } catch {
      localStorage.removeItem('lumiere-user')
      localStorage.removeItem('lumiere-token')
      return null
    }
  })

  const establishSession = (data) => {
    localStorage.setItem('lumiere-token', data.token)
    localStorage.setItem('lumiere-user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }
  const login = async (email, password, role) => {
    const { data } = await api.post('/auth/login', { email, password, role })
    return establishSession(data)
  }
  const register = async (name, email, password, role, adminRegistrationCode) => {
    const { data } = await api.post('/auth/register', { name, email, password, role, adminRegistrationCode })
    return establishSession(data)
  }
  const logout = () => {
    localStorage.removeItem('lumiere-token')
    localStorage.removeItem('lumiere-user')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

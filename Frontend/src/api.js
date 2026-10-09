import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  timeout: 12000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumiere-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

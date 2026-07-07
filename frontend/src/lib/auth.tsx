import { createContext, useContext, useState, type ReactNode } from 'react'
import api from './api'
import type { Customer } from '../types'

interface AuthContextType {
  customer: Customer | null
  token: string | null
  isAuthenticated: boolean
  login: (phone: string, pin: string) => Promise<void>
  register: (name: string, phone: string, pin: string, pinConfirmation: string) => Promise<void>
  logout: () => void
  setCustomer: (customer: Customer) => void
  refreshCustomer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(() => {
    const stored = localStorage.getItem('customer')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('customer_token'))

  const persist = (c: Customer, t: string) => {
    setCustomerState(c)
    setToken(t)
    localStorage.setItem('customer', JSON.stringify(c))
    localStorage.setItem('customer_token', t)
  }

  const login = async (phone: string, pin: string) => {
    const { data } = await api.post('/auth/login', { phone, pin })
    persist(data.customer, data.token)
  }

  const register = async (name: string, phone: string, pin: string, pin_confirmation: string) => {
    const { data } = await api.post('/auth/register', { name, phone, pin, pin_confirmation })
    persist(data.customer, data.token)
  }

  const logout = () => {
    setCustomerState(null)
    setToken(null)
    localStorage.removeItem('customer')
    localStorage.removeItem('customer_token')
  }

  const setCustomer = (c: Customer) => {
    setCustomerState(c)
    localStorage.setItem('customer', JSON.stringify(c))
  }

  const refreshCustomer = async () => {
    const { data } = await api.get('/auth/me')
    setCustomer(data.customer)
  }

  return (
    <AuthContext.Provider value={{ customer, token, isAuthenticated: !!token, login, register, logout, setCustomer, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

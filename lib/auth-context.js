'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查本地存储中的用户信息
    const checkAuth = () => {
      try {
        // 确保在客户端环境中
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user')
          const token = localStorage.getItem('token')
          
          if (storedUser && token) {
            setUser(JSON.parse(storedUser))
          }
        }
      } catch (error) {
        console.error('检查认证状态失败:', error)
        // 清除无效的本地存储
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData, token) => {
    setUser(userData)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', token)
    }
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  const isAuthenticated = () => {
    return !!user && !!getToken()
  }

  const value = {
    user,
    loading,
    login,
    logout,
    getToken,
    isAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

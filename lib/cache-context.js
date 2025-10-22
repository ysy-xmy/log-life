"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CacheContext = createContext()

export function CacheProvider({ children }) {
  const [cache, setCache] = useState({
    accounting: {
      data: [],
      lastFetch: null,
      loading: false
    },
    logs: {
      data: [],
      lastFetch: null,
      loading: false
    },
    recent: {
      data: [],
      lastFetch: null,
      loading: false
    },
    profile: {
      data: null,
      lastFetch: null,
      loading: false
    },
    userStats: {
      data: null,
      lastFetch: null,
      loading: false
    }
  })

  // 获取缓存数据
  const getCachedData = useCallback((key) => {
    return cache[key] || { data: [], lastFetch: null, loading: false }
  }, [cache])

  // 设置缓存数据
  const setCachedData = useCallback((key, data, loading = false) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        lastFetch: Date.now(),
        loading
      }
    }))
  }, [])

  // 清除缓存
  const clearCache = useCallback((key) => {
    if (key) {
      setCache(prev => ({
        ...prev,
        [key]: { data: [], lastFetch: null, loading: false }
      }))
    } else {
      setCache({
        accounting: { data: [], lastFetch: null, loading: false },
        logs: { data: [], lastFetch: null, loading: false },
        recent: { data: [], lastFetch: null, loading: false },
        profile: { data: null, lastFetch: null, loading: false },
        userStats: { data: null, lastFetch: null, loading: false }
      })
    }
  }, [])

  // 检查数据是否需要刷新（超过5分钟）
  const shouldRefresh = useCallback((key, maxAge = 5 * 60 * 1000) => {
    const cached = getCachedData(key)
    if (!cached.lastFetch) return true
    return Date.now() - cached.lastFetch > maxAge
  }, [getCachedData])

  // 添加新记录到缓存
  const addToCache = useCallback((key, newItem) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data: [newItem, ...(prev[key]?.data || [])]
      }
    }))
  }, [])

  // 更新缓存中的记录
  const updateInCache = useCallback((key, updatedItem) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data: prev[key]?.data.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ) || []
      }
    }))
  }, [])

  // 从缓存中删除记录
  const removeFromCache = useCallback((key, itemId) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        data: prev[key]?.data.filter(item => item.id !== itemId) || []
      }
    }))
  }, [])

  const value = {
    cache,
    getCachedData,
    setCachedData,
    clearCache,
    shouldRefresh,
    addToCache,
    updateInCache,
    removeFromCache
  }

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}

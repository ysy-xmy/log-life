"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { LoadingSpinner, PulseSpinner } from '@/components/ui/loading-spinner'

export function usePullRefresh(onRefresh, threshold = 60) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  
  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isPulling) return

    currentY.current = e.touches[0].clientY
    const distance = Math.max(0, currentY.current - startY.current)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(distance)
    }
  }, [isPulling])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return

    setIsPulling(false)
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }, [isPulling, pullDistance, threshold, onRefresh])

  // 添加触摸事件监听器
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const refreshIndicator = (
    <div 
      className={`transition-all duration-300 ease-out ${
        isRefreshing ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        height: isRefreshing ? '60px' : `${Math.min(pullDistance, threshold)}px`,
        background: isRefreshing 
          ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.06) 0%, rgba(107, 114, 128, 0.06) 100%)'
          : 'transparent'
      }}
    >
      <div className="flex items-center justify-center h-full">
        {isRefreshing ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <LoadingSpinner size="md" color="gray" />
              <div className="absolute inset-0">
                <PulseSpinner size="md" color="gray" />
              </div>
            </div>
            <span className="text-sm text-gray-600 font-medium">刷新中...</span>
          </div>
        ) : pullDistance > 0 ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              {/* 进度圆环 */}
              <div className="w-6 h-6 rounded-full border-2 border-gray-200">
                <div 
                  className="w-full h-full rounded-full border-2 border-gray-500 border-t-transparent transition-all duration-200"
                  style={{
                    transform: `rotate(${(pullDistance / threshold) * 360}deg)`,
                    opacity: Math.min(pullDistance / threshold, 1)
                  }}
                />
              </div>
              {/* 中心图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                {pullDistance >= threshold ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                )}
              </div>
              {/* 成功状态的光环效果 */}
              {pullDistance >= threshold && (
                <div className="absolute inset-0 animate-ping rounded-full h-6 w-6 border border-green-300 opacity-40"></div>
              )}
            </div>
            <span className="text-sm text-gray-600 font-medium transition-colors duration-200">
              {pullDistance >= threshold ? (
                <span className="text-green-600">松开刷新</span>
              ) : (
                <span>继续下拉</span>
              )}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    refreshIndicator
  }
}

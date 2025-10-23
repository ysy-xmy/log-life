"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useInputFocusListener } from './use-prevent-scroll'

export function usePullRefresh(onRefresh, threshold = 100, loadingText = "刷新中...") {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [canPullRefresh, setCanPullRefresh] = useState(false)
  
  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef(null)
  const isAtTop = useRef(true)

  // 监听输入框焦点状态变化
  useInputFocusListener(setIsInputFocused)

  // 检查是否在容器顶部
  const checkIsAtTop = useCallback(() => {
    if (!containerRef.current) {
      console.log('❌ 容器引用不存在')
      return false
    }
    
    // 查找真正的滚动容器
    let scrollContainer = containerRef.current
    let foundScrollable = false
    
    // 向上查找可滚动的父容器
    while (scrollContainer && scrollContainer !== document.body) {
      const computedStyle = window.getComputedStyle(scrollContainer)
      const overflowY = computedStyle.overflowY
      
      if (overflowY === 'auto' || overflowY === 'scroll') {
        foundScrollable = true
        break
      }
      
      scrollContainer = scrollContainer.parentElement
    }
    
    if (!foundScrollable) {
      // 如果没找到可滚动容器，检查window
      const windowScrollY = window.scrollY || document.documentElement.scrollTop
      console.log('🔝 使用window滚动:', windowScrollY)
      return windowScrollY <= 2
    }
    
    const scrollTop = scrollContainer.scrollTop
    const isAtTop = scrollTop <= 2
    
    console.log('🔝 找到滚动容器 - 是否在顶部:', isAtTop, '(scrollTop:', scrollTop, ')')
    
    return isAtTop
  }, [])

  // 检查是否在容器底部
  const checkIsAtBottom = useCallback(() => {
    if (!containerRef.current) return false
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    return scrollTop + clientHeight >= scrollHeight - 1
  }, [])

  const handleTouchStart = useCallback((e) => {
    // 如果输入框获得焦点，禁用下拉刷新
    if (isInputFocused) return
    console.log('👆 触摸开始')
    
    // 记录触摸开始位置
    startY.current = e.touches[0].clientY
    
    // 检查是否在顶部
    const atTop = checkIsAtTop()
    isAtTop.current = atTop
    setCanPullRefresh(atTop)
    
    console.log('👆 触摸开始 - 是否在顶部:', atTop, 'canPullRefresh:', atTop)
  }, [checkIsAtTop, isInputFocused])

  const handleTouchMove = useCallback((e) => {
    // 如果输入框获得焦点，禁用下拉刷新
    if (isInputFocused) return

    currentY.current = e.touches[0].clientY
    const distance = currentY.current - startY.current
    
    // 检查是否在顶部
    const atTop = checkIsAtTop()
    console.log('👋 触摸移动', atTop,canPullRefresh)
    // 如果不允许下拉刷新或不在顶部，不阻止默认行为
    if (!canPullRefresh || !atTop) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    // 只有在向下拉动时才触发，且距离必须大于最小阈值
    if (distance > 15 && distance < threshold * 2) {
      e.preventDefault() // 只有在确认是下拉刷新时才阻止默认行为
      setIsPulling(true)
      setPullDistance(distance)
      console.log('✅ 开始下拉刷新，距离:', distance)
    } else if (distance <= 15) {
      // 向上滑动或距离太小时重置状态，不阻止默认行为
      setIsPulling(false)
      setPullDistance(0)
    }
  }, [threshold, isInputFocused, canPullRefresh, checkIsAtTop])

  const handleTouchEnd = useCallback(async () => {
    // 如果输入框获得焦点，禁用下拉刷新
    if (isInputFocused || !isPulling || !isAtTop.current) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    // 最终检查是否真的在顶部
    if (!checkIsAtTop()) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

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
  }, [isPulling, pullDistance, threshold, onRefresh, isInputFocused, checkIsAtTop])

  // 统一的 loading 管理函数
  const setLoading = useCallback((loading) => {
    setIsLoading(loading)
  }, [])

  // 监听滚动事件来更新顶部状态
  const handleScroll = useCallback(() => {
    isAtTop.current = checkIsAtTop()
    if (!isAtTop.current && isPulling) {
      setIsPulling(false)
      setPullDistance(0)
    }
  }, [checkIsAtTop, isPulling])

  // 添加触摸事件监听器
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll])

  // 统一的 loading 组件
  const loadingIndicator = (
    <div className="flex justify-center items-center py-8">
      <div className="flex items-center space-x-3">
        <div className="relative">
          {/* 旋转 loading 动画 */}
          <div 
            className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
            style={{ 
              animation: 'spin 1s linear infinite'
            }}
          ></div>
          {/* 脉冲光环效果 */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-6 h-6 rounded-full bg-blue-200 opacity-30"></div>
          </div>
        </div>
        <span className="text-sm text-gray-600 font-medium animate-pulse">{loadingText}</span>
      </div>
    </div>
  )

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
              {/* 简单的旋转 loading 动画 */}
              <div 
                className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                style={{ 
                  animation: 'spin 1s linear infinite'
                }}
              ></div>
              {/* 脉冲光环效果 */}
              <div className="absolute inset-0 animate-ping">
                <div className="w-6 h-6 rounded-full bg-blue-200 opacity-30"></div>
              </div>
            </div>
            <span className="text-sm text-gray-600 font-medium animate-pulse">{loadingText}</span>
          </div>
        ) : pullDistance > 0 ? (
          <div className="flex items-center space-x-3">
            <div className="relative">
              {/* 动态进度圆环 */}
              <div className="w-6 h-6 rounded-full border-2 border-gray-200">
                <div 
                  className="w-full h-full rounded-full border-2 border-blue-500 border-t-transparent transition-all duration-200"
                  style={{
                    transform: `rotate(${(pullDistance / threshold) * 360}deg)`,
                    opacity: Math.min(pullDistance / threshold, 1)
                  }}
                />
              </div>
              {/* 中心动态图标 */}
              <div className="absolute inset-0 flex items-center justify-center">
                {pullDistance >= threshold ? (
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                ) : (
                  <div 
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full transition-all duration-200"
                    style={{
                      transform: `scale(${1 + (pullDistance / threshold) * 0.5})`,
                      opacity: 0.6 + (pullDistance / threshold) * 0.4
                    }}
                  ></div>
                )}
              </div>
              {/* 成功状态的光环效果 */}
              {pullDistance >= threshold && (
                <div className="absolute inset-0 animate-ping rounded-full h-6 w-6 border border-green-300 opacity-40"></div>
              )}
              {/* 下拉过程中的动态效果 */}
              {pullDistance > 0 && pullDistance < threshold && (
                <div 
                  className="absolute inset-0 animate-pulse rounded-full border border-blue-300 opacity-30"
                  style={{
                    transform: `scale(${1 + (pullDistance / threshold) * 0.3})`,
                    animationDuration: `${2 - (pullDistance / threshold)}s`
                  }}
                ></div>
              )}
            </div>
            <span className="text-sm text-gray-600 font-medium transition-colors duration-200">
              {pullDistance >= threshold ? (
                <span className="text-green-600 animate-pulse">松开刷新</span>
              ) : (
                <span className="animate-pulse">继续下拉</span>
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
    refreshIndicator,
    isLoading,
    setLoading,
    loadingIndicator
  }
}

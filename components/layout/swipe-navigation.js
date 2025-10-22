"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    name: "记录",
    href: "/",
    icon: "Plus",
  },
  {
    name: "日志", 
    href: "/logs",
    icon: "BookOpen",
  },
  {
    name: "记账",
    href: "/accounting", 
    icon: "Calculator",
  },
  {
    name: "统计",
    href: "/statistics",
    icon: "BarChart3", 
  },
  {
    name: "我的",
    href: "/profile",
    icon: "User",
  },
]

export default function SwipeNavigation({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const currentY = useRef(0)
  const isDraggingRef = useRef(false)

  // 根据当前路径确定索引
  useEffect(() => {
    const index = navigationItems.findIndex(item => item.href === pathname)
    if (index !== -1) {
      setCurrentIndex(index)
    }
  }, [pathname])

  // 处理触摸开始
  const handleTouchStart = (e) => {
    if (isTransitioning) return
    
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    currentX.current = e.touches[0].clientX
    currentY.current = e.touches[0].clientY
    isDraggingRef.current = true
    setIsDragging(true)
  }

  // 处理触摸移动
  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || isTransitioning) return
    
    currentX.current = e.touches[0].clientX
    currentY.current = e.touches[0].clientY
    const deltaX = currentX.current - startX.current
    const deltaY = Math.abs(currentY.current - startY.current)
    
    // 如果水平滑动距离大于垂直滑动距离，则阻止默认行为并处理滑动
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 20) {
      e.preventDefault()
      
      // 实时更新容器位置
      if (containerRef.current) {
        const translateX = deltaX * 0.4 // 稍微增加跟随速度
        containerRef.current.style.transform = `translateX(${translateX}px)`
      }
    }
  }

  // 处理触摸结束
  const handleTouchEnd = (e) => {
    if (!isDraggingRef.current || isTransitioning) return
    
    isDraggingRef.current = false
    setIsDragging(false)
    const deltaX = currentX.current - startX.current
    const threshold = 80 // 滑动阈值
    
    // 重置容器位置
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateX(0px)'
    }
    
    // 判断是否切换页面
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex > 0) {
        // 向右滑动，切换到上一个页面
        navigateToIndex(currentIndex - 1)
      } else if (deltaX < 0 && currentIndex < navigationItems.length - 1) {
        // 向左滑动，切换到下一个页面
        navigateToIndex(currentIndex + 1)
      }
    }
  }

  // 导航到指定索引
  const navigateToIndex = (index) => {
    if (index < 0 || index >= navigationItems.length || isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentIndex(index)
    
    // 添加页面切换动画
    if (containerRef.current) {
      // 先添加淡出效果
      containerRef.current.style.transition = 'opacity 0.15s ease-out'
      containerRef.current.style.opacity = '0.7'
      
      setTimeout(() => {
        // 导航到新页面
        router.push(navigationItems[index].href)
        
        // 延迟一点时间让新页面加载
        setTimeout(() => {
          // 恢复淡入效果
          if (containerRef.current) {
            containerRef.current.style.opacity = '1'
            containerRef.current.style.transition = 'opacity 0.2s ease-in'
          }
          
          // 重置状态
          setTimeout(() => {
            setIsTransitioning(false)
            if (containerRef.current) {
              containerRef.current.style.transition = ''
            }
          }, 200)
        }, 100)
      }, 150)
    } else {
      router.push(navigationItems[index].href)
      setIsTransitioning(false)
    }
  }

  // 处理鼠标事件（用于桌面端测试）
  const handleMouseDown = (e) => {
    if (isTransitioning) return
    
    startX.current = e.clientX
    startY.current = e.clientY
    currentX.current = e.clientX
    currentY.current = e.clientY
    isDraggingRef.current = true
    setIsDragging(true)
  }

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || isTransitioning) return
    
    currentX.current = e.clientX
    currentY.current = e.clientY
    const deltaX = currentX.current - startX.current
    const deltaY = Math.abs(currentY.current - startY.current)
    
    // 如果水平滑动距离大于垂直滑动距离，则处理滑动
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 20) {
      if (containerRef.current) {
        const translateX = deltaX * 0.4
        containerRef.current.style.transform = `translateX(${translateX}px)`
      }
    }
  }

  const handleMouseUp = () => {
    if (!isDraggingRef.current || isTransitioning) return
    
    isDraggingRef.current = false
    setIsDragging(false)
    const deltaX = currentX.current - startX.current
    const threshold = 80
    
    if (containerRef.current) {
      containerRef.current.style.transform = 'translateX(0px)'
    }
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex > 0) {
        navigateToIndex(currentIndex - 1)
      } else if (deltaX < 0 && currentIndex < navigationItems.length - 1) {
        navigateToIndex(currentIndex + 1)
      }
    }
  }

  // 添加全局鼠标事件监听
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => handleMouseUp()

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingRef.current])

  return (
    <div className="relative h-full overflow-hidden">
      {/* 主要内容区域 */}
      <div
        ref={containerRef}
        className={cn(
          "h-full w-full transition-all duration-300 ease-out",
          isDragging && "transition-none" // 拖拽时禁用过渡
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{ 
          touchAction: 'pan-y',
          transform: isDragging ? undefined : 'translateX(0px)'
        }}
      >
        {/* 添加页面切换时的淡入淡出效果 */}
        <div className={cn(
          "h-full transition-opacity duration-200",
          isTransitioning ? "opacity-70" : "opacity-100"
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

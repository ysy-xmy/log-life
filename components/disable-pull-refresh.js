"use client"

import { useEffect } from 'react'

export default function DisablePullRefresh() {
  useEffect(() => {
    // 禁用下拉刷新的CSS属性
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior = 'none'
    
    // 禁用触摸事件的下拉刷新
    let startY = 0
    let isAtTop = false

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY
      isAtTop = window.scrollY === 0
    }

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY
      const deltaY = currentY - startY

      // 如果在顶部且向下滑动，阻止默认行为
      if (isAtTop && deltaY > 0) {
        e.preventDefault()
      }
    }

    const handleWheel = (e) => {
      if (window.scrollY === 0 && e.deltaY < 0) {
        e.preventDefault()
      }
    }

    const handleKeyDown = (e) => {
      // 禁用 F5 和 Ctrl+R
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
      }
    }

    // 添加事件监听器
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('keydown', handleKeyDown)

    // 清理函数
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null // 这个组件不渲染任何内容
}

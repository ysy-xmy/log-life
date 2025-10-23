"use client"

import { useEffect } from 'react'

export default function DisablePullRefresh() {
  useEffect(() => {
    // 只禁用键盘刷新，允许正常滚动
    const handleKeyDown = (e) => {
      // 禁用 F5 和 Ctrl+R
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
      }
    }

    // 只添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown)

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null // 这个组件不渲染任何内容
}

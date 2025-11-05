"use client"

import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import HomePage from "@/app/page"
import LogsPage from "@/app/logs/page"
import AccountingPage from "@/app/accounting/page"
import StatisticsPage from "@/app/statistics/page"
import ProfilePage from "@/app/profile/page"
import Navigation from "@/components/layout/navigation"

// 创建标签页切换上下文
export const TabContext = createContext({
  activeTab: '/',
  setActiveTab: () => {}
})

export const useTab = () => useContext(TabContext)

const tabComponents = {
  '/': HomePage,
  '/logs': LogsPage,
  '/accounting': AccountingPage,
  '/statistics': StatisticsPage,
  '/profile': ProfilePage,
}

// 获取路径的主路径
const getMainPath = (pathname) => {
  if (!pathname || pathname === '/') return '/'
  const parts = pathname.split('/').filter(Boolean)
  return parts.length > 0 ? `/${parts[0]}` : '/'
}

// 判断是否是标签页路径
const isTabPath = (pathname) => {
  const mainPath = getMainPath(pathname)
  return tabComponents[mainPath] !== undefined
}

export default function TabContainer({ children }) {
  const pathname = usePathname()
  // 从 pathname 初始化 activeTab，避免初始值为 '/' 时的问题
  const [activeTab, setActiveTab] = useState(() => {
    // 使用函数形式初始化，只在首次渲染时执行
    if (typeof window === 'undefined') return '/'
    const mainPath = getMainPath(pathname)
    return isTabPath(pathname) && tabComponents[mainPath] ? mainPath : '/'
  })
  const initializedRef = useRef(false)

  // 调试：监听 activeTab 变化
  useEffect(() => {
    console.log('activeTab changed:', activeTab, 'pathname:', pathname)
  }, [activeTab, pathname])

  // 包装 setActiveTab 以确保状态更新，使用 flushSync 确保同步更新
  const handleSetActiveTab = useCallback((tab) => {
    console.log('Setting activeTab to:', tab, 'from:', activeTab)
    // 立即更新状态，使用 flushSync 确保同步更新（如果需要的话）
    // 但通常直接 setState 就足够了，React 18 会自动批处理
    setActiveTab(tab)
  }, [activeTab])

  // 稳定的 context 值
  const contextValue = useMemo(() => ({
    activeTab,
    setActiveTab: handleSetActiveTab
  }), [activeTab, handleSetActiveTab])

  // 初始化时，根据当前路径设置活动标签（只在首次加载时执行一次）
  useEffect(() => {
    if (!initializedRef.current && pathname) {
      if (isTabPath(pathname)) {
        const mainPath = getMainPath(pathname)
        if (tabComponents[mainPath]) {
          console.log('Initializing activeTab from pathname:', pathname, '->', mainPath)
          setActiveTab(mainPath)
        }
      }
      initializedRef.current = true
    }
  }, [pathname]) // 依赖 pathname，但通过 initializedRef 确保只执行一次

  // 同步 URL（但不触发路由跳转，保持页面状态）
  useEffect(() => {
    if (initializedRef.current && isTabPath(activeTab)) {
      const currentPath = getMainPath(pathname)
      // 只有当 activeTab 与当前路径的主路径不同时才更新 URL
      if (activeTab !== currentPath) {
        console.log('Syncing URL: activeTab', activeTab, 'pathname', pathname, 'currentPath', currentPath)
        // 使用 replace 更新 URL，但不触发页面重新加载
        // 延迟执行，避免立即触发 pathname 更新导致状态重置
        const timer = setTimeout(() => {
          if (typeof window !== 'undefined') {
            try {
              window.history.replaceState({ ...window.history.state, as: activeTab, url: activeTab }, '', activeTab)
            } catch (e) {
              console.error('Failed to update URL:', e)
            }
          }
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [activeTab, pathname]) // 依赖 activeTab 和 pathname

  return (
    <TabContext.Provider value={contextValue}>
      {isTabPath(pathname) ? (
        // 如果是标签页路径，渲染所有标签页组件（通过 display 控制显示/隐藏）
        <>
          {Object.entries(tabComponents).map(([path, Component]) => {
            const isActive = activeTab === path
            console.log(`Rendering ${path}, isActive: ${isActive}, activeTab: ${activeTab}`)
            return (
              <div
                key={path}
                style={{
                  display: isActive ? 'block' : 'none',
                  height: '100%',
                  width: '100%',
                  visibility: isActive ? 'visible' : 'hidden',
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: 'opacity 0.2s ease',
                }}
              >
                <Component />
              </div>
            )
          })}
        </>
      ) : (
        // 如果不是标签页路径（如 /login, /register），直接渲染 children
        <>{children}</>
      )}
      {/* Navigation 始终渲染，但在非标签页路径时会自己隐藏 */}
      <Navigation />
    </TabContext.Provider>
  )
}

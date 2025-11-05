"use client"

import { useState, useEffect, useRef, createContext, useContext } from "react"
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

// 判断是否是标签页路径
const isTabPath = (pathname) => {
  const mainPath = '/' + pathname.split('/').filter(Boolean)[0] || '/'
  return tabComponents[mainPath] !== undefined
}

export default function TabContainer({ children }) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('/')
  const initializedRef = useRef(false)

  // 初始化时，根据当前路径设置活动标签
  useEffect(() => {
    if (!initializedRef.current) {
      if (isTabPath(pathname)) {
        const mainPath = '/' + pathname.split('/').filter(Boolean)[0] || '/'
        if (tabComponents[mainPath]) {
          setActiveTab(mainPath)
        }
      }
      initializedRef.current = true
    }
  }, [pathname])

  // 同步 URL（但不触发路由跳转，保持页面状态）
  useEffect(() => {
    if (initializedRef.current && isTabPath(activeTab) && activeTab !== pathname) {
      // 使用 replace 更新 URL，但不触发页面重新加载
      window.history.replaceState({ ...window.history.state, as: activeTab, url: activeTab }, '', activeTab)
    }
  }, [activeTab, pathname]) // 只在 activeTab 变化时更新 URL

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {isTabPath(pathname) ? (
        // 如果是标签页路径，渲染所有标签页组件（通过 display 控制显示/隐藏）
        <>
          {Object.entries(tabComponents).map(([path, Component]) => (
            <div
              key={path}
              style={{
                display: activeTab === path ? 'block' : 'none',
                height: '100%',
              }}
            >
              <Component />
            </div>
          ))}
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

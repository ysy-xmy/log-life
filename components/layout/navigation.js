"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect } from "react"
import { 
  BookOpen, 
  Calculator, 
  BarChart3, 
  User,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTab } from "./tab-container"

const navigationItems = [
  {
    name: "记录",
    href: "/",
    icon: Plus,
  },
  {
    name: "日志",
    href: "/logs",
    icon: BookOpen,
  },
  {
    name: "记账",
    href: "/accounting",
    icon: Calculator,
  },
  {
    name: "统计",
    href: "/statistics",
    icon: BarChart3,
  },
  {
    name: "我的",
    href: "/profile",
    icon: User,
  },
]

function NavigationContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  
  // 获取 tab context
  const { activeTab, setActiveTab } = useTab()

  // 确保在客户端环境中
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 检查是否应该隐藏底部导航栏
  const shouldHideNavigation = () => {
    // 在服务器端渲染时，默认不隐藏导航栏
    if (!isClient) {
      return false
    }

    // 查看日志页面
    if (pathname.startsWith('/log/')) {
      return true
    }
    
    // 首页显示表单时隐藏导航栏（通过URL参数判断）
    if (pathname === '/' && (searchParams.get('log') === 'true' || searchParams.get('accounting') === 'true')) {
      return true
    }
    
    // 日志页面显示表单时隐藏导航栏（通过URL参数判断）
    if (pathname === '/logs' && (searchParams.get('new') === 'true' || searchParams.get('edit'))) {
      return true
    }
    
    return false
  }

  // 处理标签页切换
  const handleTabClick = (href) => {
    setActiveTab(href)
  }

  // 如果不是标签页路径（如 /login），隐藏导航栏
  const isTabPath = pathname === '/' || pathname === '/logs' || pathname === '/accounting' || 
                    pathname === '/statistics' || pathname === '/profile' ||
                    pathname.startsWith('/logs') || pathname.startsWith('/accounting') ||
                    pathname.startsWith('/statistics') || pathname.startsWith('/profile')

  if (!isTabPath) {
    return null
  }

  // 如果需要隐藏导航栏，返回null
  if (shouldHideNavigation()) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.href
            return (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 transition-colors cursor-pointer",
                  isActive
                    ? "text-gray-800"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "text-gray-800")} />
                <span className={cn("text-xs", isActive && "font-medium")}>
                  {item.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default function Navigation() {
  return (
    <Suspense fallback={
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-around h-16">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.name}
                  className="flex flex-col items-center justify-center flex-1 py-2"
                >
                  <Icon className="h-5 w-5 mb-1 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {item.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </nav>
    }>
      <NavigationContent />
    </Suspense>
  )
}

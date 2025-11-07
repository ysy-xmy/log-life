"use client"

import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState, useEffect, useCallback } from "react"
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
  const router = useRouter()
  
  // 获取 tab context
  const { activeTab, setActiveTab } = useTab()

  // 检查是否应该隐藏底部导航栏 - 不依赖 isClient，确保服务器端和客户端一致
  const shouldHideNavigation = () => {
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

  // 处理标签页切换 - 立即响应，不等待任何异步操作
  const handleTabClick = useCallback((e, href) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('Tab clicked:', href, 'Current activeTab:', activeTab, 'Current pathname:', pathname)
    
    // 如果点击的是当前激活的 tab，不执行任何操作
    const mainPath = pathname === '/' ? '/' : `/${pathname.split('/').filter(Boolean)[0]}`
    if (mainPath === href) {
      console.log('Already on this tab, skipping')
      return
    }
    
    // 立即更新状态
    setActiveTab(href)
    // 更新 URL，使用 push 而不是 replace，这样可以在浏览器历史中记录
    router.push(href)
  }, [activeTab, setActiveTab, pathname, router])

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
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
      style={{ 
        touchAction: 'manipulation',
        pointerEvents: 'auto',
        // 确保导航栏始终可点击，不受其他元素影响
        isolation: 'isolate'
      }}
    >
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon
            // 使用 pathname 来判断是否激活，确保服务器端和客户端一致
            // 对于首页，精确匹配 "/"
            // 对于其他路径，匹配路径或子路径
            const isActive = item.href === '/' 
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <button
                key={item.name}
                onClick={(e) => handleTabClick(e, item.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 transition-colors cursor-pointer touch-manipulation",
                  isActive
                    ? "text-gray-800"
                    : "text-gray-500 hover:text-gray-700"
                )}
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  pointerEvents: 'auto',
                  // 确保按钮可以立即响应点击
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
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
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
        style={{ 
          touchAction: 'manipulation',
          pointerEvents: 'auto',
          isolation: 'isolate'
        }}
      >
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


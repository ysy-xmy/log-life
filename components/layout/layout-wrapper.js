"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

function LayoutWrapperContent({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 检查是否应该隐藏底部导航栏
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

  const hideNavigation = shouldHideNavigation()

  return (
    <main 
      className={cn(
        "w-full max-w-md mx-auto bg-gray-50 overflow-hidden relative",
        hideNavigation ? "h-screen" : "h-[calc(100vh-4rem)]" // 4rem = 64px (h-16)
      )}
    >
        {children}
    </main>
  )
}

export default function LayoutWrapper({ children }) {
  return (
    <Suspense fallback={
      <main className="w-full max-w-md mx-auto bg-gray-50 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex justify-center items-center h-full">
          <div className="text-gray-500">加载中...</div>
        </div>
      </main>
    }>
      <LayoutWrapperContent>{children}</LayoutWrapperContent>
    </Suspense>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { 
  BookOpen, 
  Calculator, 
  BarChart3, 
  User,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

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

export default function Navigation() {
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

  // 如果需要隐藏导航栏，返回null
  if (shouldHideNavigation()) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 transition-colors",
                  isActive
                    ? "text-gray-800"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "text-gray-800")} />
                <span className={cn("text-xs", isActive && "font-medium")}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

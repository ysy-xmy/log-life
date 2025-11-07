"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import LogForm from "@/components/log/log-form"
import AccountingForm from "@/components/accounting/accounting-form"
import { Plus, X, BookOpen, Calculator, Minus, Search, Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCache } from "@/lib/cache-context"
import { usePreventScroll } from "@/lib/use-prevent-scroll"
import { MOOD_TAGS } from "@/lib/data"

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth()
  const { getCachedData, setCachedData, shouldRefresh } = useCache()
  const router = useRouter()
  const [showLogForm, setShowLogForm] = useState(false)
  const [showAccountingForm, setShowAccountingForm] = useState(false)
  const logFormRef = useRef(null)
  const accountingFormRef = useRef(null)

  // 启用全局防滚动穿透功能
  usePreventScroll(true)

  // 获取最近记录（带缓存）
  const fetchRecentRecords = async (forceRefresh = false) => {
    const cachedData = getCachedData('recent')
    
    // 如果有缓存且不需要强制刷新，直接返回缓存数据
    if (!forceRefresh && cachedData.data.length > 0 && !shouldRefresh('recent', 2 * 60 * 1000)) {
      return cachedData.data
    }

    try {
      setCachedData('recent', [], true) // 设置loading状态
      const { recentApi } = await import('@/lib/api-client')
      const response = await recentApi.getRecentRecords(3)
      if (response.success) {
        const data = response.data || []
        setCachedData('recent', data, false)
        return data
      }
    } catch (error) {
      console.error('获取最近记录失败:', error)
      setCachedData('recent', [], false)
    }
    return []
  }

  useEffect(() => {
    // 等待认证状态加载完成
    if (!loading) {
      if (isAuthenticated()) {
        // 使用 setTimeout 确保不阻塞 UI 渲染和事件处理
        const timer = setTimeout(() => {
          fetchRecentRecords()
        }, 0)
        return () => clearTimeout(timer)
      } else {
        // 在 useEffect 中处理路由跳转，避免渲染时调用
        router.push('/login')
      }
    }
  }, [loading, isAuthenticated, router])

  const handleLogSave = async (savedLog) => {
    setShowLogForm(false)
    fetchRecentRecords(true) // 强制刷新最近记录
  }

  const handleAccountingSave = async (savedRecord) => {
    setShowAccountingForm(false)
    fetchRecentRecords(true) // 强制刷新最近记录
  }

  const handleCloseLogForm = () => {
    setShowLogForm(false)
  }

  const handleCloseAccountingForm = () => {
    setShowAccountingForm(false)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  // 获取心情信息
  const getMoodInfo = (moodId) => {
    return MOOD_TAGS.find(mood => mood.id === moodId) || { name: moodId, emoji: '😊', color: 'bg-gray-100 text-gray-800' }
  }

  // 解析心情数据，支持单个心情ID或心情数组
  const parseMoods = (moodData) => {
    if (!moodData) return []
    
    // 如果是数组，直接返回
    if (Array.isArray(moodData)) {
      return moodData
    }
    
    // 如果是字符串，可能是JSON字符串或单个心情ID
    if (typeof moodData === 'string') {
      try {
        const parsed = JSON.parse(moodData)
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch (e) {
        // 不是JSON，当作单个心情ID处理
        return [moodData]
      }
    }
    
    // 其他情况，当作单个心情ID处理
    return [moodData]
  }


  // 如果正在加载认证状态
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // 如果未登录，显示跳转提示
  if (!isAuthenticated()) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-gray-500">跳转到登录页面...</div>
      </div>
    )
  }

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '早上好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }

  // 获取用户名
  const getUserName = () => {
    return user?.name || user?.email?.split('@')[0] || '用户'
  }

  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-y-auto">
      {/* 顶部问候区域 */}
      <div className="px-4 pt-6 pb-4 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hi, {getGreeting()} 👋
            </h1>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {getUserName()}!
            </h2>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="h-6 w-6 text-gray-700" />
          </button>
        </div>


      </div>

      {/* 快捷入口 - 横向滚动卡片 */}
      <div className="px-4 py-4 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 mb-3">快捷功能</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {/* 写日志卡片 */}
          <div
            onClick={() => setShowLogForm(true)}
            className="flex-shrink-0 w-32 h-40 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-white"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg mb-1">写日志</div>
              <div className="text-xs opacity-90">记录生活</div>
            </div>
          </div>

          {/* 记账卡片 */}
          <div
            onClick={() => setShowAccountingForm(true)}
            className="flex-shrink-0 w-32 h-40 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-white"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Calculator className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg mb-1">记账</div>
              <div className="text-xs opacity-90">收支管理</div>
            </div>
          </div>

          <div
            onClick={() => router.push('/statistics')}
            className="flex-shrink-0 w-32 h-40 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-white"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg mb-1">统计</div>
              <div className="text-xs opacity-90">数据分析</div>
            </div>
          </div>

        </div>
      </div>

      {/* 最近记录 - 可滚动区域 */}
      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">最近记录</h2>
          <button 
            onClick={() => router.push('/logs')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            查看全部
          </button>
        </div>
        
        <div className="space-y-3">
          {(() => {
            const cachedData = getCachedData('recent')
            const recentRecords = cachedData.data
            
            if (cachedData.loading) {
              return (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">加载中...</div>
                </div>
              )
            }
            
            if (recentRecords.length > 0) {
              return recentRecords.map((log) => (
              <div 
                key={log.id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-3"
                onClick={() => router.push(`/log/${log.id}`)}
              >
                <div className="flex items-start gap-4">
                  {/* 左侧内容 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                      {log.content}
                    </h3>
                    <div className="text-xs text-gray-500 mb-3">
                      {formatTime(log.created_at)}
                    </div>
                    {/* 心情标签 */}
                    {log.mood && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {parseMoods(log.mood).map((moodId, index) => (
                          <span key={index} className="text-lg">
                            {getMoodInfo(moodId).emoji}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* 记账信息 */}
                    {log.accounting && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`px-3 py-1 rounded-lg ${log.accounting.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <div className="flex items-center gap-1">
                            {log.accounting.type === 'income' ? (
                              <Plus className="h-3 w-3 text-green-600" />
                            ) : (
                              <Minus className="h-3 w-3 text-red-600" />
                            )}
                            <span className={`text-sm font-semibold ${log.accounting.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              ¥{log.accounting.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* 右侧图片预览 */}
                  {log.images && log.images.length > 0 && (() => {
                    const getImageUrl = (image) => {
                      if (!image) return ''
                      if (typeof image === 'string') return image
                      if (typeof image === 'object' && image.url) return image.url
                      return ''
                    }
                    
                    const imageUrl = getImageUrl(log.images[0])
                    if (!imageUrl) return null
                    
                    return (
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
                          <img
                            src={imageUrl}
                            alt="日志图片"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><div class="text-white text-2xl">📷</div></div>'
                            }}
                          />
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
              ))
            } else {
              return (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <div className="text-gray-400 text-4xl mb-3">📝</div>
                  <div className="text-gray-500 text-sm">还没有任何记录</div>
                  <div className="text-gray-400 text-xs mt-1">开始记录你的生活吧</div>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* 写日志表单 - 全屏模态 */}
      {showLogForm && (
        <div className="max-w-md mx-auto fixed inset-0 bg-white z-50 flex flex-col">
          {/* 顶部导航栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCloseLogForm}
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-800">写新日志</h2>
            <Button 
              onClick={() => {
                if (logFormRef.current) {
                  logFormRef.current.handleSave()
                }
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4"
            >
              发布
            </Button>
          </div>
          
          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <LogForm 
              ref={logFormRef}
              onSave={handleLogSave}
            />
          </div>
        </div>
      )}

      {/* 记账表单 - 全屏模态 */}
      {showAccountingForm && (
        <div className="max-w-md mx-auto fixed inset-0 bg-white z-50 flex flex-col">
          {/* 顶部导航栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCloseAccountingForm}
            >
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-800">新增记账</h2>
            <Button 
              onClick={() => {
                if (accountingFormRef.current) {
                  accountingFormRef.current.handleSave()
                }
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4"
            >
              保存
            </Button>
          </div>
          
          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <AccountingForm 
              ref={accountingFormRef}
              onSave={handleAccountingSave}
            />
          </div>
        </div>
      )}
    </div>
  )
}

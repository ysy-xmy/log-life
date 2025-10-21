"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import LogForm from "@/components/log/log-form"
import AccountingForm from "@/components/accounting/accounting-form"
import { Plus, X, BookOpen, Calculator } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [showLogForm, setShowLogForm] = useState(false)
  const [showAccountingForm, setShowAccountingForm] = useState(false)
  const [recentLogs, setRecentLogs] = useState([])
  const logFormRef = useRef(null)
  const accountingFormRef = useRef(null)

  // 获取最近日志
  const fetchRecentLogs = async () => {
    try {
      const { logsApi } = await import('@/lib/api-client')
      const response = await logsApi.getLogs({ limit: 3 })
      if (response.success) {
        setRecentLogs(response.data || [])
      }
    } catch (error) {
      console.error('获取最近日志失败:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated()) {
      fetchRecentLogs()
    }
  }, [isAuthenticated])

  const handleLogSave = () => {
    setShowLogForm(false)
    fetchRecentLogs() // 刷新最近日志
  }

  const handleAccountingSave = () => {
    setShowAccountingForm(false)
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

  // 如果正在加载认证状态
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // 如果未登录，重定向到登录页面
  if (!isAuthenticated()) {
    router.push('/login')
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">跳转到登录页面...</div>
      </div>
    )
  }

  return (
    <div className=" bg-gray-50">
      {/* 大幅宣传区域 */}
      <div className=" px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="https://obscloud.ulearning.cn/resources/web/1760957036011360.png" 
              className="w-32 h-32 object-cover rounded-full shadow-lg"
              alt="产品形象"
              loading="eager"
              decoding="sync"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Log Life</h1>
          <p className="text-lg text-gray-600 mb-2">记录生活的每一天</p>
          <p className="text-sm text-gray-500 mb-2">让每一天都值得回忆</p>
        </div>
      </div>

      {/* 日期时间卡片 */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-800">
                  {new Date().toLocaleDateString('zh-CN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('zh-CN', { 
                    weekday: 'long' 
                  })}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">
                {new Date().toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </div>
              <div className="text-xs text-gray-500">
                {new Date().getHours() < 12 ? '上午' : new Date().getHours() < 18 ? '下午' : '晚上'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷入口按钮 */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          {/* 写日志按钮 */}
          <div className="text-center">
            <button
              onClick={() => setShowLogForm(true)}
              className="w-full h-24 bg-gray-800 hover:bg-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-white group"
            >
              <BookOpen className="h-8 w-8 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">写日志</span>
            </button>
          </div>

          {/* 记账按钮 */}
          <div className="text-center">
            <button
              onClick={() => setShowAccountingForm(true)}
              className="w-full h-24 bg-gray-600 hover:bg-gray-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center text-white group"
            >
              <Calculator className="h-8 w-8 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">记账</span>
            </button>
          </div>
        </div>
      </div>

      {/* 最近日志 */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">最近记录</h2>
          <button 
            onClick={() => router.push('/logs')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            查看全部
          </button>
        </div>
        
        <div className="space-y-3">
          {recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div 
                key={log.id}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/log/${log.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 line-clamp-2">
                      {log.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatTime(log.created_at)}
                    </div>
                  </div>
                  {log.mood && (
                    <div className="ml-3 text-2xl">
                      {log.mood}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="text-gray-400 text-4xl mb-3">📝</div>
              <div className="text-gray-500 text-sm">还没有任何记录</div>
              <div className="text-gray-400 text-xs mt-1">开始记录你的生活吧</div>
            </div>
          )}
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

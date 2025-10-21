"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import LogForm from "@/components/log/log-form"
import LogList from "@/components/log/log-list"
import { Plus, X, Search, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

function LogsPageContent() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editingLog, setEditingLog] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showLogForm, setShowLogForm] = useState(false)
  const [newLog, setNewLog] = useState(null)
  const logFormRef = useRef(null)

  const handleLogEdit = useCallback(async (log) => {
    try {
      // 如果需要加载完整的日志数据
      if (typeof log === 'string' || log.id) {
        const { logsApi } = await import('@/lib/api-client')
        const response = await logsApi.getLog(typeof log === 'string' ? log : log.id)
        if (response.success) {
          setEditingLog(response.data)
        } else {
          console.error('加载日志失败:', response.error)
          setEditingLog(log)
        }
      } else {
        setEditingLog(log)
      }
      setShowLogForm(true)
      // 设置URL参数以便Navigation组件能正确检测
      const logId = typeof log === 'string' ? log : log.id
      router.push(`/logs?edit=${logId}`, { scroll: false })
    } catch (error) {
      console.error('加载日志失败:', error)
      setEditingLog(log)
      setShowLogForm(true)
      // 设置URL参数以便Navigation组件能正确检测
      const logId = typeof log === 'string' ? log : log.id
      router.push(`/logs?edit=${logId}`, { scroll: false })
    }
  }, [router])

  // 处理URL参数中的编辑模式
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      handleLogEdit(editId)
    }
  }, [searchParams, handleLogEdit])

  const handleLogSave = (savedLog) => {
    setEditingLog(null)
    setRefreshKey(prev => prev + 1)
    // 如果不是编辑模式，将新日志传递给LogList组件
    if (savedLog && !editingLog) {
      setNewLog(savedLog)
    }
    // 强制刷新日志列表
    console.log('日志保存成功，刷新列表')
    // 清除URL参数
    router.push('/logs', { scroll: false })
  }

  const handleNewLog = () => {
    setEditingLog(null)
    setNewLog(null) // 清除之前的newLog
    setShowLogForm(true)
    // 更新URL参数以便Navigation组件能正确检测
    router.push('/logs?new=true', { scroll: false })
  }

  const handleCloseLogForm = () => {
    setShowLogForm(false)
    setEditingLog(null)
    // 清除URL参数
    router.push('/logs', { scroll: false })
  }

  const handleLogDelete = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleLogView = (log) => {
    router.push(`/log/${log.id}`)
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
    <div>
      {/* 顶部标题和搜索 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-40">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-800">生活日志</h1>
          <Button 
            onClick={handleNewLog}
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full h-10 px-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            写记录
          </Button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索日志内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-full text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* 日志列表 */}
      <div className="px-4 py-4">
        <LogList 
          onEdit={handleLogEdit}
          onDelete={handleLogDelete}
          onView={handleLogView}
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          newLog={newLog}
        />
      </div>

      {/* 写日志表单 - 全屏高度，PC端限制宽度 */}
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
            <h2 className="text-lg font-semibold text-gray-800">
              {editingLog ? '编辑日志' : '写新日志'}
            </h2>
            <Button 
              onClick={() => {
                // 调用LogForm的保存方法
                if (logFormRef.current) {
                  logFormRef.current.handleSave()
                }
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-4"
            >
              {editingLog ? '保存' : '发布'}
            </Button>
          </div>
          
          {/* 表单内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            <LogForm 
              ref={logFormRef}
              onSave={(savedLog) => {
                handleLogSave(savedLog)
                handleCloseLogForm()
              }}
              initialData={editingLog}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function LogsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <LogsPageContent />
    </Suspense>
  )
}

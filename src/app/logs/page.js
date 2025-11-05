"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import LogForm from "@/components/log/log-form"
import LogList from "@/components/log/log-list"
import { Plus, X, Search, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePreventScroll } from "@/lib/use-prevent-scroll"
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
  const listContainerRef = useRef(null)
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(false)
  const editingLogIdRef = useRef(null) // 使用 ref 跟踪当前编辑的日志ID，避免循环
  const isClosingRef = useRef(false) // 标记是否正在关闭表单，避免闪烁

  // 启用全局防滚动穿透功能
  usePreventScroll(true)

  // 保存滚动位置
  useEffect(() => {
    const container = listContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logsScrollPosition', container.scrollTop.toString())
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 检查是否需要恢复滚动位置（仅在非刷新时）
  useEffect(() => {
    // 检查是否有刷新标记（从编辑保存返回）
    const needsRefresh = searchParams.get('refresh') === 'true'
    
    if (needsRefresh) {
      // 清除刷新标记，同时清除保存的滚动位置（因为需要刷新）
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('logsScrollPosition')
      }
      router.replace('/logs', { scroll: false })
      setShouldRestoreScroll(false)
      // 需要刷新时，不恢复滚动位置
      return
    }

    // 标记需要恢复滚动位置
    if (typeof window !== 'undefined') {
      const savedPosition = sessionStorage.getItem('logsScrollPosition')
      if (savedPosition) {
        setShouldRestoreScroll(true)
      }
    }
  }, [router, searchParams, refreshKey])

  // 实际恢复滚动位置（等待列表加载完成）
  useEffect(() => {
    if (!shouldRestoreScroll) return

    const container = listContainerRef.current
    if (container && typeof window !== 'undefined') {
      const savedPosition = sessionStorage.getItem('logsScrollPosition')
      if (savedPosition) {
        // 延迟恢复，确保DOM已渲染和列表已加载
        const timer = setTimeout(() => {
          if (container) {
            container.scrollTop = parseInt(savedPosition, 10)
            setShouldRestoreScroll(false) // 恢复完成后清除标记
          }
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [shouldRestoreScroll, refreshKey])

  const handleLogEdit = useCallback(async (log, updateUrl = true) => {
    // 如果正在关闭，不执行编辑操作
    if (isClosingRef.current) {
      return
    }
    
    console.log('开始编辑日志:', log)
    console.log('当前认证状态:', isAuthenticated())
    const logId = typeof log === 'string' ? log : log.id
    
    // 如果已经在编辑该日志，直接返回（使用 ref 避免依赖状态）
    if (editingLogIdRef.current === logId) {
      return
    }
    
    // 立即设置 ref，避免重复调用
    editingLogIdRef.current = logId
    
    // 如果是从列表页点击编辑按钮，需要更新 URL
    if (updateUrl && typeof log === 'object' && log.id) {
      const currentEditId = new URLSearchParams(window.location.search).get('edit')
      if (currentEditId !== logId) {
        router.replace(`/logs?edit=${logId}`, { scroll: false })
      }
    }
    
    try {
      // 如果需要加载完整的日志数据
      if (typeof log === 'string' || log.id) {
        const { logsApi } = await import('@/lib/api-client')
        const response = await logsApi.getLog(logId)
        if (response.success) {
          // 再次检查是否正在关闭
          if (!isClosingRef.current) {
            setEditingLog(response.data)
            setShowLogForm(true)
          }
        } else {
          console.error('加载日志失败:', response.error)
          if (!isClosingRef.current) {
            setEditingLog(log)
            setShowLogForm(true)
          }
        }
      } else {
        if (!isClosingRef.current) {
          setEditingLog(log)
          setShowLogForm(true)
        }
      }
    } catch (error) {
      console.error('加载日志失败:', error)
      if (!isClosingRef.current) {
        setEditingLog(log)
        setShowLogForm(true)
      }
    }
  }, [isAuthenticated, router])

  // 处理URL参数中的编辑模式和刷新标记
  useEffect(() => {
    // 如果正在关闭，完全跳过处理
    if (isClosingRef.current) {
      return
    }
    
    const editId = searchParams.get('edit')
    const needsRefresh = searchParams.get('refresh') === 'true'
    
    // 如果URL中有edit参数，且当前没有在编辑该日志，则加载编辑
    // 使用 ref 判断，避免依赖状态导致循环
    if (editId) {
      // 如果已经在编辑该日志，确保表单是打开状态
      if (editingLogIdRef.current === editId) {
        if (!showLogForm) {
          setShowLogForm(true)
        }
      } else {
        // 立即设置表单状态，避免闪烁
        setShowLogForm(true)
        // 从 URL 参数触发的编辑，不需要更新 URL（URL 已经正确）
        handleLogEdit(editId, false)
      }
    } else if (!editId && showLogForm && editingLogIdRef.current) {
      // 如果URL中没有edit参数，但表单是打开的且在编辑状态，说明应该关闭表单
      // 这种情况通常发生在用户手动清除URL参数或直接访问/logs时
      editingLogIdRef.current = null
      setShowLogForm(false)
      setEditingLog(null)
    }
    
    if (needsRefresh) {
      // 从编辑保存返回，需要刷新列表
      setRefreshKey(prev => prev + 1)
      // 清除刷新标记
      router.replace('/logs', { scroll: false })
    }
  }, [searchParams, router, showLogForm]) // 移除 handleLogEdit 和 editingLog 依赖，避免循环

  const handleLogSave = async (savedLog) => {
    const wasEditing = !!editingLog
    editingLogIdRef.current = null
    setEditingLog(null)
    setRefreshKey(prev => prev + 1)
    // 如果不是编辑模式，将新日志传递给LogList组件
    if (savedLog && !wasEditing) {
      setNewLog(savedLog)
    }
    // 强制刷新日志列表
    console.log('日志保存成功，刷新列表')
    // 关闭表单并清除URL参数，添加刷新标记
    setShowLogForm(false)
    router.push('/logs?refresh=true', { scroll: false })
  }

  const handleNewLog = () => {
    setEditingLog(null)
    setNewLog(null) // 清除之前的newLog
    setShowLogForm(true)
    // 更新URL参数以便Navigation组件能正确检测
    router.push('/logs?new=true', { scroll: false })
  }

  const handleCloseLogForm = () => {
    // 设置关闭标志，避免 useEffect 重复处理
    isClosingRef.current = true
    
    // 先清除 ref 和状态，立即关闭表单
    editingLogIdRef.current = null
    setEditingLog(null)
    setShowLogForm(false)
    
    // 使用 replace 清除URL参数，避免在历史记录中留下编辑页
    router.replace('/logs', { scroll: false })
    
    // 延迟重置标志，确保 useEffect 已经处理完 URL 变化
    setTimeout(() => {
      isClosingRef.current = false
    }, 300)
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
    console.log('用户未认证，重定向到登录页面')
    router.push('/login')
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">跳转到登录页面...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题和搜索 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
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
            style={{
              border: 'none',
              boxShadow: 'none',
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-full text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>

      {/* 日志列表 - 使用flex-1让列表区域自适应剩余高度 */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
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
        <div className="max-w-md mx-auto fixed inset-0 bg-white z-50 flex flex-col mobile-viewport">
          {/* 顶部导航栏 */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
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
          
          {/* 表单内容 - 使用flex-1和overflow-y-auto */}
          <div className="flex-1 overflow-y-auto p-4">
            <LogForm 
              ref={logFormRef}
              onSave={async (savedLog) => {
                await handleLogSave(savedLog)
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

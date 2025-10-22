"use client"

import { useState, useEffect } from "react"
import { Calendar, Edit, Trash2, Image as ImageIcon, Heart, ChevronDown, ChevronUp, Plus, Minus, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MOOD_TAGS, ACCOUNTING_CATEGORIES } from "@/lib/data"
import { formatDate, formatTime } from "@/lib/data"
import { logsApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useCache } from "@/lib/cache-context"
import { usePullRefresh } from "@/lib/use-pull-refresh"

export default function LogList({ onEdit, onDelete, searchQuery = "", refreshKey = 0, newLog = null, onView = null }) {
  const { user, isAuthenticated } = useAuth()
  const { getCachedData, setCachedData, shouldRefresh, addToCache, updateInCache, removeFromCache } = useCache()
  const [expandedDates, setExpandedDates] = useState(new Set())
  
  // 从缓存获取数据
  const cachedData = getCachedData('logs')
  const [logs, setLogs] = useState(cachedData.data || [])

  // 下拉刷新处理函数
  const handleRefresh = async () => {
    if (isAuthenticated()) {
      await loadLogs(true)
    }
  }

  const { containerRef, isRefreshing, refreshIndicator, isLoading, setLoading, loadingIndicator } = usePullRefresh(handleRefresh, 100, "加载中...")

  // 处理新日志添加
  useEffect(() => {
    if (newLog) {
      addToCache('logs', newLog)
      setLogs(prev => [newLog, ...prev])
    }
  }, [newLog, addToCache])

  useEffect(() => {
    if (isAuthenticated()) {
      // 如果有缓存数据且不需要刷新，直接使用缓存
      if (cachedData.data.length > 0 && !shouldRefresh('logs') && refreshKey === 0) {
        setLogs(cachedData.data)
        setLoading(false)
        return
      }
      
      // 否则加载数据，如果refreshKey > 0则强制刷新
      loadLogs(refreshKey > 0)
    } else {
      setLoading(false)
    }
  }, [searchQuery, isAuthenticated, refreshKey])

  const loadLogs = async (forceRefresh = false) => {
    try {
      setLoading(true)
      if (forceRefresh) {
        setCachedData('logs', [], true) // 设置loading状态
      }
      
      const response = await logsApi.getLogs(searchQuery)
      if (response.success) {
        setLogs(response.data)
        setCachedData('logs', response.data, false) // 更新缓存
      } else {
        console.error('获取日志失败:', response.error)
        setLogs([])
        setCachedData('logs', [], false)
      }
    } catch (error) {
      console.error('加载日志失败:', error)
      setLogs([])
      setCachedData('logs', [], false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (logId) => {
    if (confirm('确定要删除这条日志吗？')) {
      try {
        const response = await logsApi.deleteLog(logId)
        if (response.success) {
          // 从本地状态和缓存中删除
          const updatedLogs = logs.filter(log => log.id !== logId)
          setLogs(updatedLogs)
          removeFromCache('logs', logId)
          if (onDelete) onDelete(logId)
        } else {
          alert('删除失败：' + response.error)
        }
      } catch (error) {
        console.error('删除日志失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  const getMoodInfo = (moodId) => {
    return MOOD_TAGS.find(mood => mood.id === moodId) || { name: moodId, emoji: '😊', color: 'bg-gray-100 text-gray-800' }
  }

  // 获取记账类别信息
  const getAccountingCategoryInfo = (type, categoryId) => {
    const categories = type === 'income' ? ACCOUNTING_CATEGORIES.income : ACCOUNTING_CATEGORIES.expense
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '💰' }
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

  // 获取图片URL，支持base64和普通URL
  const getImageUrl = (image) => {
    if (!image) return ''
    
    // 如果是对象且包含url属性（兼容旧数据）
    if (typeof image === 'object' && image.url) {
      return image.url
    }
    
    // 如果是字符串
    if (typeof image === 'string') {
      // 尝试解析JSON字符串（兼容旧数据）
      try {
        const parsed = JSON.parse(image)
        if (parsed && typeof parsed === 'object' && parsed.url) {
          return parsed.url
        }
      } catch (e) {
        // 不是JSON，继续处理
      }
      
      // 直接返回字符串（现在直接存储base64）
      return image
    }
    
    return ''
  }

  // 按日期分组日志
  const groupLogsByDate = (logs) => {
    const grouped = {}
    logs.forEach(log => {
      const dateKey = formatDate(log.created_at || log.createdAt || log.date)
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(log)
    })
    
    // 按日期排序（最新的在前）
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((result, key) => {
        result[key] = grouped[key].sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt))
        return result
      }, {})
  }

  const toggleDateExpansion = (dateKey) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedDates(newExpanded)
  }

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    
    // 检查内容匹配
    const contentMatch = log.content.toLowerCase().includes(query)
    const titleMatch = log.title?.toLowerCase().includes(query)
    
    // 检查心情匹配
    let moodMatch = false
    if (log.mood) {
      const moods = parseMoods(log.mood)
      moodMatch = moods.some(moodId => {
        const moodInfo = getMoodInfo(moodId)
        return moodId.toLowerCase().includes(query) || 
               moodInfo.name.toLowerCase().includes(query)
      })
    }
    
    return contentMatch || titleMatch || moodMatch
  })

  // 获取分组后的日志
  const groupedLogs = groupLogsByDate(filteredLogs)

  if (isLoading) {
    return loadingIndicator
  }

  if (Object.keys(groupedLogs).length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {searchQuery ? '没有找到相关日志' : '还没有日志'}
        </h3>
        <p className="text-gray-500 text-sm">
          {searchQuery ? '尝试使用其他关键词搜索' : '开始记录您的第一篇日志吧！'}
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 scrollbar-hide">
      {refreshIndicator}
      {Object.entries(groupedLogs).map(([dateKey, dateLogs], index) => (
        <div key={dateKey} className="space-y-4">
          {/* 日期分割线 */}
          {index > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm font-medium text-gray-500">{dateKey}</span>
              </div>
            </div>
          )}
          
          {/* 第一个日期标题 */}
          {index === 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm font-medium text-gray-500">{dateKey}</span>
              </div>
            </div>
          )}

          {/* 该日期的日志列表 */}
          <div className="space-y-3">
            {dateLogs.map((log, index) => (
              <div 
                key={log.id} 
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onView && onView(log)}
              >
                {/* 头部信息 */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatTime(log.created_at || log.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // 阻止事件冒泡到卡片点击
                        onEdit && onEdit(log)
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // 阻止事件冒泡到卡片点击
                        handleDelete(log.id)
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 日志内容 */}
                <div className="mb-3">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed line-clamp-4">{log.content}</p>
                </div>

                {/* 心情标签 */}
                {log.mood && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {parseMoods(log.mood).map((moodId, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {getMoodInfo(moodId).emoji} {getMoodInfo(moodId).name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 图片预览和记账信息 */}
                <div className="flex justify-between items-end">
                  {/* 图片预览 */}
                  {log.images && log.images.length > 0 && (
                    <div className="flex items-center gap-2">
                      <img
                        src={getImageUrl(log.images[0])}
                        alt="日志图片预览"
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                        onError={(e) => {
                          console.error('图片加载失败:', e.target.src)
                          e.target.style.display = 'none'
                        }}
                      />
                      {log.images.length > 1 && (
                        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-xl border border-gray-200">
                          <div className="text-center">
                            <ImageIcon className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                            <span className="text-xs text-gray-500">+{log.images.length - 1}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 记账信息 */}
                  {log.accounting && (
                    <div className="flex ml-auto items-center space-x-2 rounded-lg px-3 py-2">
                      <div className={`p-1 rounded-full ${log.accounting.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {log.accounting.type === 'income' ? (
                          <Plus className="h-3 w-3 text-green-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${log.accounting.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {log.accounting.type === 'income' ? '+' : '-'}¥{log.accounting.amount.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getAccountingCategoryInfo(log.accounting.type, log.accounting.category).name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Calendar, Edit, Trash2, Plus, Minus, Filter, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ACCOUNTING_CATEGORIES } from "@/lib/data"
import { formatDate, formatTime } from "@/lib/data"
import { accountingApi } from "@/lib/api-client"
import { useCache } from "@/lib/cache-context"
import { usePullRefresh } from "@/lib/use-pull-refresh"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function AccountingList({ onEdit, onDelete, refreshTrigger, newRecord }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const { getCachedData, setCachedData, shouldRefresh, addToCache, updateInCache, removeFromCache } = useCache()
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // 当类型筛选改变时，检查类别筛选是否需要重置
  const handleFilterTypeChange = (newType) => {
    setFilterType(newType)
    
    // 如果当前选择的类别不匹配新的类型，重置为"全部"
    if (filterCategory !== 'all') {
      const isIncomeCategory = ACCOUNTING_CATEGORIES.income.some(cat => cat.id === filterCategory)
      const isExpenseCategory = ACCOUNTING_CATEGORIES.expense.some(cat => cat.id === filterCategory)
      
      if (newType === 'income' && !isIncomeCategory) {
        setFilterCategory('all')
      } else if (newType === 'expense' && !isExpenseCategory) {
        setFilterCategory('all')
      }
    }
  }
  
  // 从缓存获取数据
  const cachedData = getCachedData('accounting')
  const [records, setRecords] = useState(cachedData.data || [])

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, router])

  // 下拉刷新处理函数
  const handleRefresh = async () => {
    await loadRecords(true)
  }

  const { containerRef, isRefreshing, refreshIndicator, isLoading, setLoading, loadingIndicator } = usePullRefresh(handleRefresh, 100, "加载中...")

  useEffect(() => {
    // 只有在用户已认证的情况下才加载数据
    if (!authLoading && isAuthenticated()) {
      // 如果有缓存数据且不需要刷新，直接使用缓存
      if (cachedData.data.length > 0 && !shouldRefresh('accounting')) {
        setRecords(cachedData.data)
        setLoading(false)
        return
      }
      
      // 否则加载数据
      loadRecords()
    }
  }, [authLoading, isAuthenticated])

  // 当refreshTrigger变化时重新加载数据
  useEffect(() => {
    if (refreshTrigger > 0 && !authLoading && isAuthenticated()) {
      loadRecords(true)
    }
  }, [refreshTrigger, authLoading, isAuthenticated])

  // 当有新记录时，直接添加到缓存和本地状态
  useEffect(() => {
    if (newRecord && !authLoading && isAuthenticated()) {
      addToCache('accounting', newRecord)
      setRecords(prevRecords => {
        // 检查是否已存在相同ID的记录，避免重复添加
        const exists = prevRecords.some(record => record.id === newRecord.id)
        if (exists) {
          return prevRecords
        }
        return [newRecord, ...prevRecords]
      })
    }
  }, [newRecord, addToCache, authLoading, isAuthenticated])

  const loadRecords = async (forceRefresh = false) => {
    // 确保用户已认证
    if (!isAuthenticated()) {
      console.warn('用户未认证，无法加载数据')
      return
    }
    
    try {
      setLoading(true)
      setCachedData('accounting', [], true) // 设置loading状态
      
      const response = await accountingApi.getRecords()
      const data = response.data || []
      
      setRecords(data)
      setCachedData('accounting', data, false) // 更新缓存
    } catch (error) {
      console.error('加载记录失败:', error)
      // 如果是认证错误，重定向到登录页
      if (error.message.includes('认证') || error.message.includes('401')) {
        router.push('/login')
        return
      }
      alert(`加载记录失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recordId) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await accountingApi.deleteRecord(recordId)
        const updatedRecords = records.filter(record => record.id !== recordId)
        setRecords(updatedRecords)
        removeFromCache('accounting', recordId) // 从缓存中删除
        if (onDelete) onDelete(recordId)
      } catch (error) {
        console.error('删除记录失败:', error)
        // 如果是认证错误，重定向到登录页
        if (error.message.includes('认证') || error.message.includes('401')) {
          router.push('/login')
          return
        }
        alert(`删除失败: ${error.message}`)
      }
    }
  }

  const getCategoryInfo = (type, categoryId) => {
    const categories = type === 'income' ? ACCOUNTING_CATEGORIES.income : ACCOUNTING_CATEGORIES.expense
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '💰' }
  }

  const filteredRecords = records.filter(record => {
    if (filterType !== 'all' && record.type !== filterType) return false
    if (filterCategory !== 'all' && record.category !== filterCategory) return false
    return true
  })

  // 按日期分组记录
  const groupRecordsByDate = (records) => {
    const grouped = {}
    records.forEach(record => {
      const dateKey = formatDate(record.date || record.created_at)
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(record)
    })
    
    // 按日期排序（最新的在前）
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((result, key) => {
        result[key] = grouped[key].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        return result
      }, {})
  }

  const totalIncome = filteredRecords
    .filter(record => record.type === 'income')
    .reduce((sum, record) => sum + record.amount, 0)

  const totalExpense = filteredRecords
    .filter(record => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0)

  const balance = totalIncome - totalExpense

  // 获取分组后的记录
  const groupedRecords = groupRecordsByDate(filteredRecords)

  // 如果正在加载认证状态，显示加载中
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">验证身份中...</div>
      </div>
    )
  }

  // 如果用户未认证，不渲染内容（会被重定向到登录页）
  if (!isAuthenticated()) {
    return null
  }

  if (isLoading) {
    return loadingIndicator
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {refreshIndicator}
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Plus className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mb-1">收入</p>
          <p className="text-sm font-semibold text-green-600">¥{totalIncome.toFixed(0)}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Minus className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xs text-gray-500 mb-1">支出</p>
          <p className="text-sm font-semibold text-red-600">¥{totalExpense.toFixed(0)}</p>
        </div>
        
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Calculator className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 mb-1">结余</p>
          <p className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ¥{balance.toFixed(0)}
          </p>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="bg-white rounded-xl p-4">

        
        {/* 类型筛选 - 按钮式 */}
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-2">类型</div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterTypeChange('all')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => handleFilterTypeChange('income')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus className="h-3 w-3 inline mr-1" />
              收入
            </button>
            <button
              onClick={() => handleFilterTypeChange('expense')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Minus className="h-3 w-3 inline mr-1" />
              支出
            </button>
          </div>
        </div>

        {/* 类别筛选 - 滚动式按钮组 */}
        <div>
          <div className="text-xs text-gray-500 mb-2">类别</div>
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            
            {/* 根据类型筛选显示对应的类别 */}
            {filterType === 'all' && (
              <>
                {/* 收入类别 */}
                {ACCOUNTING_CATEGORIES.income.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      filterCategory === cat.id
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
                {/* 支出类别 */}
                {ACCOUNTING_CATEGORIES.expense.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      filterCategory === cat.id
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </>
            )}
            
            {/* 只显示收入类别 */}
            {filterType === 'income' && ACCOUNTING_CATEGORIES.income.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
            
            {/* 只显示支出类别 */}
            {filterType === 'expense' && ACCOUNTING_CATEGORIES.expense.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      {Object.keys(groupedRecords).length === 0 ? (
        <div className="rounded-xl p-8 text-center">
          <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium  text-gray-900 mb-2">还没有记录</h3>
          <p className="text-gray-500">开始记录您的第一笔收支吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([dateKey, dateRecords], index) => (
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

              {/* 该日期的记录列表 */}
              <div className="space-y-3">
                {dateRecords.map((record) => {
                  const categoryInfo = getCategoryInfo(record.type, record.category)
                  return (
                    <div key={record.id} className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3 w-4/5">
                          <div className={`p-2 rounded-full ${record.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {record.type === 'income' ? (
                              <Plus className="h-4 w-4 text-green-600" />
                            ) : (
                              <Minus className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{categoryInfo.icon}</span>
                              <span className="font-medium text-gray-800">{categoryInfo.name}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatTime(record.created_at || record.date)}</span>
                            </div>
                            {record.description && (
                              <p className="text-sm text-gray-600 truncate">{record.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-col">
                        <div className="flex space-x-1">
                            <button
                              onClick={() => onEdit && onEdit(record)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <span className={`text-lg font-semibold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {record.type === 'income' ? '+' : '-'}¥{record.amount.toFixed(0)}
                          </span>

                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

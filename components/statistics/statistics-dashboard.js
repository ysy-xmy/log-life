"use client"

import { useState, useEffect } from "react"
import { LogCountChart, MoodChart, IncomeExpenseChart, TrendChart, CategoryChart } from "./chart-components"
import { MOOD_TAGS, ACCOUNTING_CATEGORIES } from "@/lib/data"
import { logsApi, accountingApi } from "@/lib/api-client"
import { usePullRefresh } from "@/lib/use-pull-refresh"
import { useCache } from "@/lib/cache-context"
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, DollarSign, BookOpen, Heart } from "lucide-react"

export default function StatisticsDashboard() {
  const [logs, setLogs] = useState([])
  const [records, setRecords] = useState([])
  const [timeRange, setTimeRange] = useState('week')
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'logs', 'accounting'
  const { getCachedData, setCachedData, shouldRefresh } = useCache()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logsRes, recordsRes] = await Promise.all([
        logsApi.getLogs(''),
        accountingApi.getRecords(),
      ])
      const logsData = Array.isArray(logsRes?.data) ? logsRes.data : []
      const recordsData = Array.isArray(recordsRes?.data) ? recordsRes.data : []
      setLogs(logsData)
      setRecords(recordsData)
      setCachedData('logs', logsData)
      setCachedData('accounting', recordsData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 先尝试读取缓存
    const cachedLogs = getCachedData('logs')
    const cachedAccounting = getCachedData('accounting')
    if (cachedLogs?.data?.length) setLogs(cachedLogs.data)
    if (cachedAccounting?.data?.length) setRecords(cachedAccounting.data)

    // 判断是否需要刷新
    if (shouldRefresh('logs') || shouldRefresh('accounting')) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [getCachedData, shouldRefresh])

  const { containerRef, refreshIndicator, isLoading, setLoading, loadingIndicator } = usePullRefresh(fetchData, 100, "加载中...")

  const getDateRange = () => {
    const now = new Date()
    switch (timeRange) {
      case 'week':
        return {
          start: startOfDay(subWeeks(now, 1)),
          end: endOfDay(now)
        }
      case 'month':
        return {
          start: startOfDay(subMonths(now, 1)),
          end: endOfDay(now)
        }
      case 'year':
        return {
          start: startOfDay(subMonths(now, 12)),
          end: endOfDay(now)
        }
      default:
        return {
          start: startOfDay(subWeeks(now, 1)),
          end: endOfDay(now)
        }
    }
  }

  const getLogStatistics = () => {
    // 统一解析心情：兼容 log.moods 数组、log.mood 字符串/JSON 字符串
    const normalizeMoods = (log) => {
      if (Array.isArray(log?.moods) && log.moods.length > 0) {
        return log.moods
      }
      const raw = log?.mood
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed
          // 不是数组 JSON，则按单个 id 处理
          return [raw]
        } catch {
          // 普通字符串，按单个 id 处理
          return [raw]
        }
      }
      return [raw]
    }
    const { start, end } = getDateRange()
    const filteredLogs = logs.filter(log => {
      const rawDate = log?.date || log?.created_at
      if (!rawDate) return false
      const logDate = new Date(rawDate)
      return logDate >= start && logDate <= end
    })

    // 按日期/月份统计日志数量
    const logCountData = []
    if (timeRange === 'year') {
      // 12个月聚合
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i)
        const monthKey = format(d, 'yyyy-MM')
        const count = filteredLogs.filter(log => {
          const rawDate = log?.date || log?.created_at
          if (!rawDate) return false
          const key = format(new Date(rawDate), 'yyyy-MM')
          return key === monthKey
        }).length
        logCountData.push({
          date: format(d, 'yy/MM'),
          count
        })
      }
    } else {
      // 周/一月：按日聚合（7天或30天）
      const daysCount = timeRange === 'month' ? 30 : 7
      const now = new Date()
      const days = []
      for (let i = 0; i < daysCount; i++) {
        const date = subDays(now, daysCount - 1 - i)
        days.push(date)
      }
      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const count = filteredLogs.filter(log => {
          const rawDate = log?.date || log?.created_at
          if (!rawDate) return false
          const normalized = format(new Date(rawDate), 'yyyy-MM-dd')
          return normalized === dayStr
        }).length
        logCountData.push({
          date: format(day, 'MM/dd'),
          count
        })
      })
    }

    // 心情统计
    const moodCounts = {}
    filteredLogs.forEach(log => {
      const moods = normalizeMoods(log)
      moods.forEach(moodId => {
        moodCounts[moodId] = (moodCounts[moodId] || 0) + 1
      })
    })

    const moodData = Object.entries(moodCounts).map(([moodId, count]) => {
      const moodInfo = MOOD_TAGS.find(m => m.id === moodId)
      return {
        id: moodId,
        name: moodInfo ? moodInfo.name : moodId,
        emoji: moodInfo ? moodInfo.emoji : '😊',
        value: count
      }
    })

    return { logCountData, moodData, totalLogs: filteredLogs.length }
  }

  const getAccountingStatistics = () => {
    const { start, end } = getDateRange()
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= start && recordDate <= end
    })

    // 按日期/月份统计收支
    const incomeExpenseData = []
    if (timeRange === 'year') {
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = subMonths(now, i)
        const monthKey = format(d, 'yyyy-MM')
        const monthRecords = filteredRecords.filter(record => {
          const key = format(new Date(record.date), 'yyyy-MM')
          return key === monthKey
        })
        const income = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
        const expense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
        incomeExpenseData.push({
          date: format(d, 'yy/MM'),
          income,
          expense,
          balance: income - expense
        })
      }
    } else {
      const daysCount = timeRange === 'month' ? 30 : 7
      const now = new Date()
      const days = []
      for (let i = 0; i < daysCount; i++) {
        const date = subDays(now, daysCount - 1 - i)
        days.push(date)
      }
      days.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const dayRecords = filteredRecords.filter(record => {
          const key = format(new Date(record.date), 'yyyy-MM-dd')
          return key === dayStr
        })
        const income = dayRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
        const expense = dayRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
        incomeExpenseData.push({
          date: format(day, 'MM/dd'),
          income,
          expense,
          balance: income - expense
        })
      })
    }

    // 类别统计
    const categoryCounts = {}
    filteredRecords.forEach(record => {
      const categoryKey = `${record.type}_${record.category}`
      if (!categoryCounts[categoryKey]) {
        categoryCounts[categoryKey] = { amount: 0, count: 0, type: record.type, category: record.category }
      }
      categoryCounts[categoryKey].amount += record.amount
      categoryCounts[categoryKey].count += 1
    })

    const categoryData = Object.entries(categoryCounts).map(([key, data]) => {
      const categoryInfo = data.type === 'income' 
        ? ACCOUNTING_CATEGORIES.income.find(c => c.id === data.category)
        : ACCOUNTING_CATEGORIES.expense.find(c => c.id === data.category)
      
      return {
        name: categoryInfo ? categoryInfo.name : data.category,
        value: data.amount,
        type: data.type
      }
    })

    // 总体统计
    const totalIncome = filteredRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
    const totalExpense = filteredRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
    const balance = totalIncome - totalExpense

    return { 
      incomeExpenseData, 
      categoryData, 
      totalIncome, 
      totalExpense, 
      balance,
      totalRecords: filteredRecords.length 
    }
  }

  if (isLoading) {
    return loadingIndicator
  }

  const logStats = getLogStatistics()
  const accountingStats = getAccountingStatistics()

  return (
    <div className="bg-gray-50 h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">统计</h1>
        </div>
        
        {/* 时间范围选择按钮 */}
   
      </div>
      {refreshIndicator}

      {/* 主要内容 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {/* 底部导航 */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
              activeTab === 'overview' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">概览</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
              activeTab === 'logs' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">日志</span>
          </button>
          <button
            onClick={() => setActiveTab('accounting')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
              activeTab === 'accounting' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">记账</span>
          </button>
        </div>
        <div className="flex space-x-2 justify-end">
          {[
            { key: 'week', label: '一周' },
            { key: 'month', label: '一月' },
            { key: 'year', label: '一年' }
          ].map(range => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                timeRange === range.key
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* 概览页面 */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 关键指标 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{logStats.totalLogs}</div>
                <div className="text-xs text-gray-500">日志数量</div>
              </div>
              
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-800">¥{accountingStats.balance.toFixed(0)}</div>
                <div className="text-xs text-gray-500">结余</div>
              </div>
            </div>

            {/* 收支对比 */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">收支情况</h3>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">收入</span>
                  </div>
                  <span className="font-medium text-green-600">¥{accountingStats.totalIncome.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">支出</span>
                  </div>
                  <span className="font-medium text-red-600">¥{accountingStats.totalExpense.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* 心情概览 */}
            {logStats.moodData.length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-800">心情概览</h3>
                  <Heart className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {logStats.moodData.slice(0, 4).map((mood, index) => (
                    <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-full">
                      <span className="text-sm">{mood.emoji}</span>
                      <span className="text-xs text-gray-600">{mood.name}</span>
                      <span className="text-xs text-gray-400">({mood.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 日志统计页面 */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-4">日志趋势</h3>
              <LogCountChart data={logStats.logCountData} />
            </div>
            
            {logStats.moodData.length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-4">心情分布</h3>
                <MoodChart data={logStats.moodData} />
              </div>
            )}
          </div>
        )}

        {/* 记账统计页面 */}
        {activeTab === 'accounting' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-4">收支趋势</h3>
              <IncomeExpenseChart data={accountingStats.incomeExpenseData} />
            </div>
            
            {accountingStats.categoryData.length > 0 && (
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-4">类别统计</h3>
                <CategoryChart data={accountingStats.categoryData} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

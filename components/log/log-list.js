"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  
  // 分页状态
  const [page, setPage] = useState(1)
  const pageRef = useRef(1) // 使用 ref 存储当前页码，确保闭包中获取最新值
  const [hasMore, setHasMore] = useState(true)
  const hasMoreRef = useRef(true) // 使用 ref 存储是否有更多数据
  const [loadingMore, setLoadingMore] = useState(false)
  const loadingMoreRef = useRef(false) // 使用 ref 存储加载状态，避免闭包问题
  const isLoadingRef = useRef(false) // 使用 ref 存储初始加载状态
  const observerTarget = useRef(null)
  const observerRef = useRef(null) // 存储 IntersectionObserver 实例
  const isInitializedRef = useRef(false) // 标记是否已初始化
  
  // 同步 ref 和 state
  useEffect(() => {
    pageRef.current = page
  }, [page])
  
  useEffect(() => {
    loadingMoreRef.current = loadingMore
  }, [loadingMore])
  
  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])
  
  // 从缓存获取数据 - 使用函数形式初始化，避免在渲染时读取
  const [logs, setLogs] = useState(() => {
    const cachedData = getCachedData('logs')
    return cachedData.data || []
  })
  const [deletingLogId, setDeletingLogId] = useState(null)

  // 下拉刷新处理函数
  const handleRefresh = async () => {
    if (isAuthenticated()) {
      await loadLogs(true, true)
    }
  }

  const { containerRef, isRefreshing, refreshIndicator, isLoading, setLoading, loadingIndicator } = usePullRefresh(handleRefresh, 100, "加载中...")
  
  // 同步 isLoading 到 ref（必须在 usePullRefresh 之后）
  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  // 处理新日志添加 - 使用 useEffect 确保不在渲染时调用
  useEffect(() => {
    if (newLog) {
      // 使用 setTimeout 确保在下一个事件循环中执行，避免在渲染时更新
      const timer = setTimeout(() => {
        addToCache('logs', newLog)
        // 去重：如果日志已存在则不再添加
        setLogs(prev => {
          const exists = prev.some(log => log.id === newLog.id)
          if (exists) {
            // 如果已存在，则更新该日志而不是添加
            return prev.map(log => log.id === newLog.id ? newLog : log)
          }
          return [newLog, ...prev]
        })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [newLog, addToCache])

  const loadLogs = useCallback(async (forceRefresh = false, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setHasMore(true)
      }
      
      if (forceRefresh && reset) {
        setCachedData('logs', [], true) // 设置loading状态
      }
      
      // 重置时总是从第1页开始
      const currentPage = reset ? 1 : page
      const response = await logsApi.getLogs(searchQuery, currentPage, 10)
      
      if (response.success) {
        if (reset) {
        setLogs(response.data)
        // 更新缓存，保存分页信息
        const nextPage = response.pagination?.hasMore ? 2 : 1
        setCachedData('logs', response.data, false, {
          loadedPage: 1,
          hasMore: response.pagination?.hasMore ?? true
        })
        } else {
          // 去重：只添加不存在于当前列表中的日志
          setLogs(prev => {
            const existingIds = new Set(prev.map(log => log.id))
            const newLogs = response.data.filter(log => !existingIds.has(log.id))
            const updatedLogs = [...prev, ...newLogs]
            // 更新缓存，保存所有已加载的数据和分页信息
            const nextPage = response.pagination?.hasMore ? currentPage + 1 : currentPage
            setCachedData('logs', updatedLogs, false, {
              loadedPage: currentPage,
              hasMore: response.pagination?.hasMore ?? true
            })
            return updatedLogs
          })
        }
        
        // 更新分页信息
        if (response.pagination) {
          setHasMore(response.pagination.hasMore)
          hasMoreRef.current = response.pagination.hasMore
          if (reset) {
            const nextPage = response.pagination.hasMore ? 2 : 1
            setPage(nextPage)
            pageRef.current = nextPage
            console.log('📋 初始加载完成，设置页码为:', nextPage, 'hasMore:', response.pagination.hasMore, 'ref值:', pageRef.current)
          } else {
            setPage(prev => {
              const nextPage = prev + 1
              pageRef.current = nextPage
              return nextPage
            })
          }
        }
      } else {
        console.error('获取日志失败:', response.error)
        if (reset) {
        setLogs([])
        setCachedData('logs', [], false, { loadedPage: 1, hasMore: true })
        }
      }
    } catch (error) {
      console.error('加载日志失败:', error)
      if (reset) {
      setLogs([])
      setCachedData('logs', [], false)
      }
    } finally {
      setLoading(false)
    }
  }, [searchQuery, page, setCachedData])

  const loadMore = useCallback(async () => {
    // 使用 ref 检查，避免闭包问题
    if (loadingMoreRef.current || !hasMore) {
      console.log('跳过加载：', { loadingMore: loadingMoreRef.current, hasMore })
      return
    }
    
    // 先读取当前页码（在设置 loading 之前）
    const currentPage = pageRef.current
    console.log('加载更多日志，当前页码:', currentPage, 'ref值:', pageRef.current)
    
    // 立即更新 ref 和 state，防止并发调用
    loadingMoreRef.current = true
    setLoadingMore(true)
    
    try {
      const response = await logsApi.getLogs(searchQuery, currentPage, 10)
      console.log('加载更多响应:', { 
        success: response.success, 
        dataCount: response.data?.length, 
        pagination: response.pagination 
      })
      
      if (response.success) {
        // 去重：只添加不存在于当前列表中的日志
        let addedNewLogs = false
        setLogs(prev => {
          const existingIds = new Set(prev.map(log => log.id))
          const newLogs = response.data.filter(log => !existingIds.has(log.id))
          addedNewLogs = newLogs.length > 0
          const updatedLogs = [...prev, ...newLogs]
          // 更新缓存，保存所有已加载的数据和分页信息
          const nextPage = response.pagination?.hasMore ? currentPage + 1 : currentPage
          setCachedData('logs', updatedLogs, false, {
            loadedPage: currentPage,
            hasMore: response.pagination?.hasMore ?? true
          })
          return updatedLogs
        })
        
        // 更新分页信息
        if (response.pagination) {
          // 只有当还有更多数据时才更新页码
          if (response.pagination.hasMore) {
            const nextPage = currentPage + 1
            // 先更新 ref，再更新 state，确保下次调用时获取最新值
            pageRef.current = nextPage
            setPage(nextPage)
            setHasMore(true)
            console.log('页码已更新为:', nextPage, 'ref当前值:', pageRef.current)
          } else {
            console.log('没有更多数据了')
            setHasMore(false)
          }
        } else {
          setHasMore(false)
        }
        
        if (!addedNewLogs && response.data.length === 0) {
          console.warn('加载的页面没有新数据，可能已到达末尾')
          setHasMore(false)
        }
      } else {
        console.error('加载更多日志失败:', response.error)
        setHasMore(false)
      }
    } catch (error) {
      console.error('加载更多日志失败:', error)
      setHasMore(false)
    } finally {
      // 延迟清除 loading 状态，确保 DOM 更新完成，避免 IntersectionObserver 立即触发
      setTimeout(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      }, 100)
    }
  }, [searchQuery, hasMore])

  // 搜索或刷新时重置分页
  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false)
      return
    }
    
    // 只在搜索查询、refreshKey 或认证状态变化时才重置
    const shouldReset = !isInitializedRef.current || refreshKey > 0
    
    if (shouldReset) {
      console.log('🔄 触发初始化/重置，refreshKey:', refreshKey, 'searchQuery:', searchQuery)
      // 重置分页状态
      setPage(1)
      pageRef.current = 1
      setHasMore(true)
      isInitializedRef.current = true
    }
    
    const loadInitialLogs = async () => {
      // 检查缓存
      const currentCachedData = getCachedData('logs')
      const needRefresh = shouldRefresh('logs')
      
      // 只有在需要重置时才检查缓存和使用缓存
      // 如果 refreshKey > 0，说明需要强制刷新，不使用缓存
      if (shouldReset && refreshKey === 0 && currentCachedData.data.length > 0 && !needRefresh && !searchQuery.trim()) {
        console.log('💾 使用缓存数据，数量:', currentCachedData.data.length, '已加载页码:', currentCachedData.loadedPage, 'hasMore:', currentCachedData.hasMore)
        setLogs(currentCachedData.data)
        // 从缓存恢复分页信息
        const cachedPage = currentCachedData.loadedPage || 1
        const nextPage = cachedPage + 1
        pageRef.current = nextPage
        setPage(nextPage)
        hasMoreRef.current = currentCachedData.hasMore !== false
        setHasMore(currentCachedData.hasMore !== false)
        setLoading(false)
        return
      }
      
      // 只有在需要重置时才加载数据
      if (shouldReset) {
        console.log('🔄 重新加载数据，refreshKey:', refreshKey)
        await loadLogs(refreshKey > 0, true)
      }
    }
    
    loadInitialLogs()
  }, [searchQuery, isAuthenticated, refreshKey]) // 移除可能导致频繁触发的依赖

  // 滚动加载更多 - 使用 useRef 存储 isObserving，避免闭包问题
  const isObservingRef = useRef(false)
  
  // 滚动加载更多
  useEffect(() => {
    // 清理现有的 observer
    const cleanup = () => {
      const observer = observerRef.current
      if (observer) {
        const target = observerTarget.current
        if (target) {
          observer.unobserve(target)
        }
        observer.disconnect()
        observerRef.current = null
      }
    }
    
    // 如果没有更多数据，清理 observer
    if (!hasMore) {
      cleanup()
      return cleanup
    }

    // 如果正在加载初始数据，等待加载完成
    if (isLoading) {
      return
    }

    // 如果还没有日志数据，等待数据加载
    if (logs.length === 0) {
      return
    }

    // 使用 requestAnimationFrame 确保 DOM 已渲染，然后延迟创建 observer
    let retryCount = 0
    const maxRetries = 10 // 最多重试10次（1秒）
    let retryTimer = null
    
    const initObserver = () => {
      requestAnimationFrame(() => {
        const target = observerTarget.current
        if (!target) {
          retryCount++
          if (retryCount < maxRetries) {
            console.log(`❌ IntersectionObserver 未创建：观察目标不存在，等待重试 (${retryCount}/${maxRetries})`)
            // 如果元素还不存在，再延迟一段时间重试
            retryTimer = setTimeout(initObserver, 100)
            return
          } else {
            console.error('❌ IntersectionObserver 创建失败：观察目标在多次重试后仍不存在')
            return
          }
        }

        console.log('✅ 创建 IntersectionObserver，目标元素:', target, 'hasMore:', hasMoreRef.current)
        
        const observer = new IntersectionObserver(
        async (entries) => {
          const entry = entries[0]
          console.log('🔍 IntersectionObserver 触发，isIntersecting:', entry.isIntersecting, 'intersectionRatio:', entry.intersectionRatio)
          
          if (!entry.isIntersecting) {
            return
          }
          
          // 从 ref 读取最新状态
          if (loadingMoreRef.current || !hasMoreRef.current || isLoadingRef.current || isObservingRef.current) {
            console.log('⏭️ 跳过加载:', {
              loadingMore: loadingMoreRef.current,
              hasMore: hasMoreRef.current,
              isLoading: isLoadingRef.current,
              isObserving: isObservingRef.current
            })
            return
          }
          
          const currentPage = pageRef.current
          console.log('📄 开始加载，读取页码:', currentPage, 'ref当前值:', pageRef.current, 'page state:', page)
          
          // 检查页码是否有效，如果还是1，说明没有正确初始化，强制设为2
          if (currentPage === 1) {
            console.warn('⚠️ 页码仍为1，可能是初始化问题，强制设为2')
            pageRef.current = 2
            const correctedPage = 2
            const correctedNextPage = correctedPage + 1
            pageRef.current = correctedNextPage
            console.log('🔧 修正后，读取页码:', correctedPage, '下次页码:', correctedNextPage)
            
            // 使用修正后的页码继续
            isObservingRef.current = true
            loadingMoreRef.current = true
            setLoadingMore(true)
            
            try {
              console.log('📤 发起请求，页码:', correctedPage)
              const response = await logsApi.getLogs(searchQuery, correctedPage, 10)
              console.log('📦 加载响应:', { 
                success: response.success, 
                count: response.data?.length, 
                hasMore: response.pagination?.hasMore 
              })
              
              if (response.success && response.data) {
                setLogs(prev => {
                  console.log('📊 当前已有日志:', prev.length, '条')
                  console.log('📥 收到新数据:', response.data.length, '条')
                  const existingIds = new Set(prev.map(log => log.id))
                  
                  const newLogs = response.data.filter(log => !existingIds.has(log.id))
                  console.log('➕ 过滤后新日志:', newLogs.length, '条')
                  
                  if (newLogs.length === 0 && response.data.length > 0) {
                    console.warn('⚠️ 所有新数据都被去重过滤掉了！可能ID重复')
                    console.log('新数据ID:', response.data.map(log => log.id).slice(0, 5))
                  }
                  
                  const result = [...prev, ...newLogs]
                  console.log('📋 更新后总数:', result.length, '条')
                  // 更新缓存
                  setCachedData('logs', result, false, {
                    loadedPage: correctedPage,
                    hasMore: response.pagination?.hasMore ?? true
                  })
                  return result
                })
                
                if (response.pagination?.hasMore) {
                  hasMoreRef.current = true
                  setPage(correctedNextPage)
                  setHasMore(true)
                  console.log('✅ 页码已更新为:', correctedNextPage)
                } else {
                  pageRef.current = correctedPage
                  hasMoreRef.current = false
                  setHasMore(false)
                  console.log('🔚 没有更多数据了')
                }
              } else {
                pageRef.current = correctedPage
                hasMoreRef.current = false
                setHasMore(false)
                console.error('❌ 加载失败')
              }
            } catch (error) {
              console.error('❌ 加载错误:', error)
              pageRef.current = correctedPage
              hasMoreRef.current = false
              setHasMore(false)
            } finally {
              setTimeout(() => {
                loadingMoreRef.current = false
                setLoadingMore(false)
                isObservingRef.current = false
                console.log('🔄 加载状态已清除')
              }, 50)
            }
            return
          }
          
          if (currentPage < 1) {
            console.error('❌ 页码错误，重置为2:', currentPage)
            pageRef.current = 2
            return
          }
          
          // 预先更新页码（用于下次请求）
          const nextPage = currentPage + 1
          pageRef.current = nextPage
          console.log('🔄 预先更新页码为:', nextPage, '即将请求页码:', currentPage)
          
          isObservingRef.current = true
          loadingMoreRef.current = true
          setLoadingMore(true)
          
          try {
            console.log('📤 发起请求，页码:', currentPage, 'URL:', `/api/logs?search=${searchQuery}&page=${currentPage}&limit=10`)
            const response = await logsApi.getLogs(searchQuery, currentPage, 10)
            console.log('📦 加载响应:', { 
              success: response.success, 
              count: response.data?.length, 
              hasMore: response.pagination?.hasMore 
            })
            
            if (response.success && response.data) {
              // 去重并添加新数据
              setLogs(prev => {
                console.log('📊 当前已有日志:', prev.length, '条')
                console.log('📥 收到新数据:', response.data.length, '条')
                const existingIds = new Set(prev.map(log => log.id))
                console.log('🆔 已有日志ID:', Array.from(existingIds).slice(0, 5), '...')
                
                const newLogs = response.data.filter(log => !existingIds.has(log.id))
                console.log('➕ 过滤后新日志:', newLogs.length, '条')
                
                if (newLogs.length === 0 && response.data.length > 0) {
                  console.warn('⚠️ 所有新数据都被去重过滤掉了！可能ID重复')
                  console.log('新数据ID:', response.data.map(log => log.id).slice(0, 5))
                }
                
                const result = [...prev, ...newLogs]
                console.log('📋 更新后总数:', result.length, '条')
                // 更新缓存
                setCachedData('logs', result, false, {
                  loadedPage: currentPage,
                  hasMore: response.pagination?.hasMore ?? true
                })
                return result
              })
              
              // 更新分页状态
              if (response.pagination?.hasMore) {
                hasMoreRef.current = true
                setPage(nextPage)
                setHasMore(true)
                console.log('✅ 页码已更新为:', nextPage)
              } else {
                pageRef.current = currentPage // 回退页码
                hasMoreRef.current = false
                setHasMore(false)
                console.log('🔚 没有更多数据了')
              }
            } else {
              pageRef.current = currentPage
              hasMoreRef.current = false
              setHasMore(false)
              console.error('❌ 加载失败')
            }
          } catch (error) {
            console.error('❌ 加载错误:', error)
            pageRef.current = currentPage
            hasMoreRef.current = false
            setHasMore(false)
          } finally {
            setTimeout(() => {
              loadingMoreRef.current = false
              setLoadingMore(false)
              isObservingRef.current = false
              console.log('🔄 加载状态已清除')
            }, 50)
          }
        },
        { 
          threshold: 0.1, 
          rootMargin: '200px' // 提前更多触发，确保能加载
        }
      )

        observer.observe(target)
        observerRef.current = observer
        console.log('👀 IntersectionObserver 已观察')
      })
    }

    // 延迟初始化，确保 DOM 已完全渲染
    const timer = setTimeout(initObserver, 100)

    return () => {
      clearTimeout(timer)
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
      cleanup()
    }
  }, [searchQuery, hasMore, isLoading, logs.length]) // 添加 isLoading 和 logs.length 依赖，确保数据加载完成后再初始化

  const handleDelete = async (logId) => {
    if (confirm('确定要删除这条日志吗？')) {
      setDeletingLogId(logId)
      try {
        const response = await logsApi.deleteLog(logId)
        if (response.success) {
          // 从本地状态和缓存中删除
          const updatedLogs = logs.filter(log => log.id !== logId)
          setLogs(updatedLogs)
          removeFromCache('logs', logId)
          if (onDelete) onDelete(logId)
          // 显示成功提示
          alert('删除成功')
        } else {
          alert('删除失败：' + response.error)
        }
      } catch (error) {
        console.error('删除日志失败:', error)
        alert('删除失败，请重试')
      } finally {
        setDeletingLogId(null)
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

  // 生成抽象几何图形 SVG
  const generateAbstractShape = (colors) => {
    const shapes = []
    const width = 80
    const height = 80
    
    // 随机生成几个几何形状
    shapes.push(`<circle cx="${width * 0.3}" cy="${height * 0.3}" r="${width * 0.2}" fill="${colors[0]}" opacity="0.8"/>`)
    shapes.push(`<path d="M ${width * 0.7} ${height * 0.2} L ${width} ${height * 0.5} L ${width * 0.7} ${height * 0.8} Z" fill="${colors[1] || colors[0]}" opacity="0.8"/>`)
    if (colors[2]) {
      shapes.push(`<rect x="${width * 0.1}" y="${height * 0.6}" width="${width * 0.3}" height="${width * 0.3}" rx="8" fill="${colors[2]}" opacity="0.8"/>`)
    }
    if (colors[3]) {
      shapes.push(`<ellipse cx="${width * 0.8}" cy="${height * 0.7}" rx="${width * 0.15}" ry="${width * 0.1}" fill="${colors[3]}" opacity="0.8"/>`)
    }
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${shapes.join('')}</svg>`
  }

  // 按日期分组日志（去重）
  const groupLogsByDate = (logs) => {
    // 先按 ID 去重，保留最新的
    const uniqueLogs = []
    const seenIds = new Set()
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      if (!seenIds.has(log.id)) {
        seenIds.add(log.id)
        uniqueLogs.push(log)
      }
    }
    
    const grouped = {}
    uniqueLogs.forEach(log => {
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
  
  // 调试：打印日志数量
  useEffect(() => {
    console.log('🔍 日志状态变化 - 总数:', logs.length, '过滤后:', filteredLogs.length, '分组后:', Object.keys(groupedLogs).length, '个日期组')
  }, [logs.length, filteredLogs.length, Object.keys(groupedLogs).length])

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
      {Object.entries(groupedLogs).map(([dateKey, dateLogs], dateIndex) => (
        <div key={dateKey} className="space-y-3">
          {/* 日期分割线 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm font-medium text-gray-500">{dateKey}</span>
            </div>
          </div>

          {/* 该日期的日志列表 */}
          <div className="space-y-3">
            {dateLogs.map((log, logIndex) => {
              // 生成抽象几何图形的颜色组合
              const colorSchemes = [
                ['#1e40af', '#f97316', '#eab308'], // 深蓝、橙、黄
                ['#a855f7', '#f97316', '#eab308'], // 紫、橙、黄
                ['#1e40af', '#22c55e', '#f97316', '#eab308'], // 深蓝、绿、橙、黄
              ]
              const colorScheme = colorSchemes[logIndex % colorSchemes.length]
              
              return (
                <div 
                  key={log.id} 
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onView && onView(log)}
                >
                  <div className="flex items-start gap-4">
                    {/* 左侧内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                        {log.content}
                      </h3>
                      
                      {/* 时间和心情 */}
                      <div className="text-xs text-gray-500 mb-3">
                        {formatTime(log.created_at || log.createdAt)}
                        {log.mood && (
                          <span className="ml-2">
                            {parseMoods(log.mood).map((moodId, idx) => (
                              <span key={idx} className="ml-1">{getMoodInfo(moodId).emoji}</span>
                            ))}
                          </span>
                        )}
                      </div>
                      
                      {/* 记账信息 */}
                      {log.accounting && (
                        <div className="mb-3">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                            log.accounting.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.accounting.type === 'income' ? (
                              <Plus className="h-3 w-3" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                            <span>¥{log.accounting.amount.toFixed(0)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 右侧图片或抽象图形 */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const imageUrl = log.images && log.images.length > 0 ? getImageUrl(log.images[0]) : null
                        if (imageUrl) {
                          return (
                            <div className="w-20 h-20 rounded-xl overflow-hidden relative">
                              <img
                                src={imageUrl}
                                alt="日志图片"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                              {/* 如果图片加载失败，显示抽象图形 */}
                              <div 
                                className="w-full h-full absolute inset-0"
                                style={{ display: 'none' }}
                                dangerouslySetInnerHTML={{ __html: generateAbstractShape(colorScheme) }}
                              />
                            </div>
                          )
                        }
                        // 如果没有图片，显示抽象几何图形
                        return (
                          <div 
                            className="w-20 h-20 rounded-xl overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: generateAbstractShape(colorScheme) }}
                          />
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      
      {/* 滚动加载观察目标和加载提示 */}
      {hasMore && (
        <div 
          ref={observerTarget} 
          className="flex justify-center items-center py-4"
          style={{ minHeight: '50px' }} // 确保有足够高度可被观察
        >
          {loadingMore && (
            <div className="text-sm text-gray-500">加载中...</div>
          )}
        </div>
      )}
      {!hasMore && logs.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-400">
          没有更多了
        </div>
      )}
    </div>
  )
}

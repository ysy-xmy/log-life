"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Image as ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MOOD_TAGS, formatDate, formatTime } from "@/lib/data"
import { logsApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useCache } from "@/lib/cache-context"

export default function LogView() {
  const { user, isAuthenticated, loading } = useAuth()
  const { getCachedData } = useCache()
  const router = useRouter()
  const params = useParams()
  const [log, setLog] = useState(null)
  const [loadingLog, setLoadingLog] = useState(true)
  const [error, setError] = useState(null)
  const [previewImage, setPreviewImage] = useState(null) // 当前预览的图片索引
  const [touchStartPos, setTouchStartPos] = useState(0) // 触摸开始位置
  const [touchEndPos, setTouchEndPos] = useState(0) // 触摸结束位置

  // 如果未登录，使用 useEffect 重定向到登录页面（避免在渲染时更新 Router）
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    const loadLog = async () => {
      try {
        setLoadingLog(true)
        setError(null)
        
        // 先从缓存中查找
        const cachedLogs = getCachedData('logs')
        const cachedLog = cachedLogs.data.find(l => l.id === params.id)
        
        if (cachedLog) {
          console.log('从缓存加载日志:', params.id)
          setLog(cachedLog)
          setLoadingLog(false)
          return
        }
        
        // 缓存中没有，从API获取
        const response = await logsApi.getLog(params.id)
        if (response.success) {
          setLog(response.data)
        } else {
          setError(response.error || '日志不存在')
        }
      } catch (error) {
        console.error('加载日志失败:', error)
        setError('加载日志失败')
      } finally {
        setLoadingLog(false)
      }
    }

    if (params.id) {
      loadLog()
    }
  }, [params.id, getCachedData])

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

  // 处理返回（不刷新列表）
  const handleBack = () => {
    // 使用 router.back() 返回上一页，保持滚动位置
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/logs')
    }
  }

  // 处理编辑
  const handleEdit = () => {
    console.log('从详情页编辑日志:', log.id)
    // 使用 replace 而不是 push，避免在历史记录中留下详情页
    // 直接跳转到编辑页，参数已经在 URL 中
    router.replace(`/logs?edit=${log.id}`)
  }

  // 处理删除
  const handleDelete = async () => {
    if (confirm('确定要删除这条日志吗？')) {
      try {
        const response = await logsApi.deleteLog(log.id)
        if (response.success) {
          // 删除后需要刷新列表
          router.push('/logs?refresh=true')
        } else {
          alert('删除失败：' + response.error)
        }
      } catch (error) {
        console.error('删除日志失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  // 手势处理函数
  const handleTouchStart = (e) => {
    setTouchStartPos(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEndPos(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartPos || !touchEndPos) return
    
    const distance = touchStartPos - touchEndPos
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && log.images && previewImage < log.images.length - 1) {
      setPreviewImage(previewImage + 1)
    }
    if (isRightSwipe && previewImage > 0) {
      setPreviewImage(previewImage - 1)
    }
    
    setTouchStartPos(0)
    setTouchEndPos(0)
  }

  // 如果正在加载认证状态，显示加载中
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-40">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">日志详情</h1>
            <div className="w-20"></div>
          </div>
        </div>
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" color="gray" />
            <div className="text-gray-500">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  // 如果未登录，显示跳转提示（重定向会在 useEffect 中处理）
  if (!isAuthenticated()) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">跳转到登录页面...</div>
      </div>
    )
  }

  if (loadingLog) {
    return (
      <div className="min-h-screen bg-white">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-40">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">日志详情</h1>
            <div className="w-20"></div>
          </div>
        </div>
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" color="gray" />
            <div className="text-gray-500">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-40">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">日志详情</h1>
            <div className="w-20"></div>
          </div>
        </div>

        <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">加载失败</div>
            <div className="text-gray-500">{error}</div>
            <Button 
              onClick={handleBack}
              className="mt-4"
            >
              返回日志列表
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">日志不存在</div>
      </div>
    )
  }

  return (
    <div className=" bg-white">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-40">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/logs')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回
          </Button>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleEdit}
              className="hover:bg-gray-100"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 日志内容 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 用户头像和时间 */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || '用'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user?.name || user?.email || '用户'}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(log.created_at || log.createdAt)} {formatTime(log.created_at || log.createdAt)}
            </p>
          </div>
        </div>

        {/* 日志内容 */}
        <div className="mb-6">
          <p className="text-gray-900 whitespace-pre-wrap leading-relaxed text-lg">
            {log.content}
          </p>
        </div>

        {/* 心情标签 */}
        {log.mood && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {parseMoods(log.mood).map((moodId, index) => (
                <span 
                  key={`${moodId}-${index}`} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {getMoodInfo(moodId).emoji} {getMoodInfo(moodId).name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 图片展示 */}
        {log.images && log.images.length > 0 && (() => {
          // 过滤掉 null 和空值，并记录原始索引
          const validImages = log.images
            .map((img, idx) => ({ img, idx }))
            .filter(({ img }) => img != null && getImageUrl(img) !== '')
          
          if (validImages.length === 0) return null
          
          return (
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-3">
                {validImages.map(({ img, idx }, displayIndex) => (
                  <div 
                    key={typeof img === 'object' && img.id ? img.id : idx} 
                    className="relative group cursor-pointer"
                    onClick={() => setPreviewImage(idx)}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`日志图片 ${displayIndex + 1}`}
                      className="w-full max-h-96 object-cover rounded-2xl border border-gray-200"
                      onError={(e) => {
                        console.error('图片加载失败:', e.target.src)
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* 全屏图片预览 */}
        {previewImage !== null && log.images && (() => {
          // 过滤掉 null 和空值，获取有效图片
          const validImages = log.images
            .map((img, idx) => ({ img, idx }))
            .filter(({ img }) => img != null && getImageUrl(img) !== '')
          
          if (validImages.length === 0) return null
          
          // 找到当前预览图片在有效图片中的索引
          const currentValidIndex = validImages.findIndex(({ idx }) => idx === previewImage)
          if (currentValidIndex === -1) return null
          
          const currentImage = validImages[currentValidIndex]
          
          return (
            <div 
              className="fixed inset-0 z-50 bg-black flex items-center justify-center"
              onClick={() => setPreviewImage(null)}
            >
              <div 
                className="relative w-full h-full flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={getImageUrl(currentImage.img)}
                  alt={`日志图片 ${currentValidIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* 关闭按钮 */}
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-3 hover:bg-black/70 transition"
                >
                  <X className="h-6 w-6" />
                </button>

                {/* 上一张/下一张按钮 */}
                {validImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const prevIndex = currentValidIndex > 0 ? currentValidIndex - 1 : validImages.length - 1
                        setPreviewImage(validImages[prevIndex].idx)
                      }}
                      className="absolute left-4 bg-black/50 text-white rounded-full p-3 hover:bg-black/70 transition"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const nextIndex = currentValidIndex < validImages.length - 1 ? currentValidIndex + 1 : 0
                        setPreviewImage(validImages[nextIndex].idx)
                      }}
                      className="absolute right-4 bg-black/50 text-white rounded-full p-3 hover:bg-black/70 transition"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    
                    {/* 图片计数器 */}
                    <div className="absolute bottom-4 bg-black/50 text-white px-4 py-2 rounded-full">
                      {currentValidIndex + 1} / {validImages.length}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

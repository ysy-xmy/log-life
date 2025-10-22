"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, Edit, Trash2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MOOD_TAGS } from "@/lib/data"
import { formatDate, formatTime } from "@/lib/data"
import { logsApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export default function LogView() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [log, setLog] = useState(null)
  const [loadingLog, setLoadingLog] = useState(true)
  const [error, setError] = useState(null)


  // 如果未登录，重定向到登录页面
  if (!isAuthenticated()) {
    router.push('/login')
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">跳转到登录页面...</div>
      </div>
    )
  }

  useEffect(() => {
    const loadLog = async () => {
      try {
        setLoadingLog(true)
        setError(null)
        
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
  }, [params.id])

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

  // 处理编辑
  const handleEdit = () => {
    console.log('从详情页编辑日志:', log.id)
    router.push(`/logs?edit=${log.id}`)
  }

  // 处理删除
  const handleDelete = async () => {
    if (confirm('确定要删除这条日志吗？')) {
      try {
        const response = await logsApi.deleteLog(log.id)
        if (response.success) {
          router.push('/logs')
        } else {
          alert('删除失败：' + response.error)
        }
      } catch (error) {
        console.error('删除日志失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  if (loadingLog) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">加载日志中...</div>
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
              onClick={() => router.push('/logs')}
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
              onClick={() => router.push('/logs')}
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
                  key={index} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {getMoodInfo(moodId).emoji} {getMoodInfo(moodId).name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 图片展示 */}
        {log.images && log.images.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-3">
              {log.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={getImageUrl(image)}
                    alt={`日志图片 ${index + 1}`}
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
        )}
      </div>
    </div>
  )
}

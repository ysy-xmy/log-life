"use client"

import { useState } from "react"
import { ArrowLeft, Edit, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOOD_TAGS, formatDate, formatTime } from "@/lib/data"

export default function LogView({ log, onBack, onEdit, onDelete, user }) {
  const [previewImage, setPreviewImage] = useState(null)
  const [touchStartPos, setTouchStartPos] = useState(0)
  const [touchEndPos, setTouchEndPos] = useState(0)

  // 获取心情信息
  const getMoodInfo = (moodId) => {
    return MOOD_TAGS.find(mood => mood.id === moodId) || { name: moodId, emoji: '😊', color: 'bg-gray-100 text-gray-800' }
  }

  // 解析心情数据
  const parseMoods = (moodData) => {
    if (!moodData) return []
    if (Array.isArray(moodData)) return moodData
    if (typeof moodData === 'string') {
      try {
        const parsed = JSON.parse(moodData)
        if (Array.isArray(parsed)) return parsed
      } catch (e) {
        return [moodData]
      }
    }
    return [moodData]
  }

  // 获取图片URL
  const getImageUrl = (image) => {
    if (!image) return ''
    if (typeof image === 'object' && image.url) return image.url
    if (typeof image === 'string') {
      try {
        const parsed = JSON.parse(image)
        if (parsed && typeof parsed === 'object' && parsed.url) return parsed.url
      } catch (e) {}
      return image
    }
    return ''
  }

  // 手势处理
  const handleTouchStart = (e) => {
    setTouchStartPos(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEndPos(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartPos || !touchEndPos || !log.images) return
    
    const distance = touchStartPos - touchEndPos
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    const validImages = log.images
      .map((img, idx) => ({ img, idx }))
      .filter(({ img }) => img != null && getImageUrl(img) !== '')
    
    const currentValidIndex = validImages.findIndex(({ idx }) => idx === previewImage)
    if (currentValidIndex === -1) return

    if (isLeftSwipe && currentValidIndex < validImages.length - 1) {
      setPreviewImage(validImages[currentValidIndex + 1].idx)
    }
    if (isRightSwipe && currentValidIndex > 0) {
      setPreviewImage(validImages[currentValidIndex - 1].idx)
    }
    
    setTouchStartPos(0)
    setTouchEndPos(0)
  }

  if (!log) return null

  const validImages = log.images
    ? log.images.map((img, idx) => ({ img, idx })).filter(({ img }) => img != null && getImageUrl(img) !== '')
    : []

  const currentPreviewValidIndex = previewImage !== null 
    ? validImages.findIndex(({ idx }) => idx === previewImage)
    : -1

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 z-40">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回
          </Button>
          <div className="flex space-x-1">
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(log)}
                className="hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(log)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 日志内容 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 用户头像和时间 */}
        {user && (
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
        )}

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
        {validImages.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-3">
              {validImages.map(({ img, idx }) => (
                <div 
                  key={idx} 
                  className="relative group cursor-pointer"
                  onClick={() => setPreviewImage(idx)}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`日志图片`}
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

        {/* 全屏图片预览 */}
        {previewImage !== null && currentPreviewValidIndex !== -1 && (
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
                src={getImageUrl(validImages[currentPreviewValidIndex].img)}
                alt={`日志图片 ${currentPreviewValidIndex + 1}`}
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
                      const prevIndex = currentPreviewValidIndex > 0 ? currentPreviewValidIndex - 1 : validImages.length - 1
                      setPreviewImage(validImages[prevIndex].idx)
                    }}
                    className="absolute left-4 bg-black/50 text-white rounded-full p-3 hover:bg-black/70 transition"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const nextIndex = currentPreviewValidIndex < validImages.length - 1 ? currentPreviewValidIndex + 1 : 0
                      setPreviewImage(validImages[nextIndex].idx)
                    }}
                    className="absolute right-4 bg-black/50 text-white rounded-full p-3 hover:bg-black/70 transition"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* 图片计数器 */}
                  <div className="absolute bottom-4 bg-black/50 text-white px-4 py-2 rounded-full">
                    {currentPreviewValidIndex + 1} / {validImages.length}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

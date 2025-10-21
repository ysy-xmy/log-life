"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Save, Plus, Minus, DollarSign, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import MoodSelector from "./mood-selector"
import ImageUploader from "./image-uploader"
import { getTodayString, generateId, setData, getData, ACCOUNTING_CATEGORIES, MOOD_TAGS } from "@/lib/data"
import { logsApi, accountingApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

const LogForm = forwardRef(function LogForm({ onSave, initialData = null }, ref) {
  const { user, isAuthenticated } = useAuth()
  
  // 解析心情数据，支持单个心情ID或心情数组
  const parseMoodsFromInitialData = (moodData) => {
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
  
  const [content, setContent] = useState(initialData?.content || "")
  const [moods, setMoods] = useState(() => {
    // 优先使用moods字段，如果没有则使用mood字段
    const moodData = initialData?.moods || initialData?.mood
    const parsed = parseMoodsFromInitialData(moodData)
    console.log('LogForm初始化 - 原始心情数据:', moodData)
    console.log('LogForm初始化 - 解析后心情数据:', parsed)
    return parsed
  })
  const [images, setImages] = useState(initialData?.images || [])
  const [isSaving, setIsSaving] = useState(false)
  
  // 心情选择相关状态
  const [showMoodSelector, setShowMoodSelector] = useState(false)
  const [moodSelectorPosition, setMoodSelectorPosition] = useState({ top: 0, left: 0 })
  const moodSelectorRef = useRef(null)
  
  // 记账相关状态
  const [hasAccounting, setHasAccounting] = useState(false)
  const [accountingType, setAccountingType] = useState('expense') // 'income' 或 'expense'
  const [accountingAmount, setAccountingAmount] = useState("")
  const [accountingCategory, setAccountingCategory] = useState("")
  const [accountingNote, setAccountingNote] = useState("")

  // 暴露保存方法给父组件
  useImperativeHandle(ref, () => ({
    handleSave: handleSave
  }))

  // 当initialData变化时，更新表单数据
  useEffect(() => {
    if (initialData) {
      console.log('编辑日志 - initialData:', initialData)
      setContent(initialData.content || "")
      const moodData = initialData.moods || initialData.mood
      const parsedMoods = parseMoodsFromInitialData(moodData)
      console.log('编辑日志 - 原始心情数据:', moodData)
      console.log('编辑日志 - 解析后心情数据:', parsedMoods)
      setMoods(parsedMoods)
      setImages(initialData.images || [])
    } else {
      // 重置表单
      setContent("")
      setMoods([])
      setImages([])
    }
  }, [initialData])

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

  // 图片压缩函数
  const compressImage = (file, callback) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 计算压缩后的尺寸
      const maxWidth = 1200
      const maxHeight = 1200
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为base64，质量设置为0.8
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      console.log('压缩完成，base64长度:', compressedDataUrl.length) // 调试日志
      callback(compressedDataUrl)
    }
    
    img.onerror = (error) => {
      console.error('图片加载失败:', error)
      // 如果压缩失败，直接使用原始文件
      const reader = new FileReader()
      reader.onload = (e) => {
        callback(e.target.result)
      }
      reader.readAsDataURL(file)
    }
    
    img.src = URL.createObjectURL(file)
  }

  // 点击外部区域关闭心情选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moodSelectorRef.current && !moodSelectorRef.current.contains(event.target)) {
        setShowMoodSelector(false)
      }
    }

    if (showMoodSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoodSelector])

  // 动态调整textarea高度
  useEffect(() => {
    const textarea = document.querySelector('textarea[placeholder*="今天发生了什么有趣的事情"]')
    if (textarea) {
      // 重置高度为auto以获取正确的scrollHeight
      textarea.style.height = 'auto'
      // 设置高度为scrollHeight，但不超过最大高度
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 400
      const minHeight = 200
      
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`
        textarea.style.overflowY = 'auto'
      } else if (scrollHeight < minHeight) {
        textarea.style.height = `${minHeight}px`
        textarea.style.overflowY = 'hidden'
      } else {
        textarea.style.height = `${scrollHeight}px`
        textarea.style.overflowY = 'hidden'
      }
    }
  }, [content])

  // 处理内容输入变化，检测#符号
  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // 检测是否输入了#符号
    const lastChar = newContent.slice(-1)
    if (lastChar === '#') {
      // 获取光标位置
      const textarea = e.target
      const rect = textarea.getBoundingClientRect()
      const cursorPosition = textarea.selectionStart
      
      // 计算#符号的位置
      const textBeforeCursor = newContent.substring(0, cursorPosition)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines.length - 1
      const currentColumn = lines[lines.length - 1].length
      
      // 设置心情选择器位置
      setMoodSelectorPosition({
        top: rect.top + (currentLine * 20) + 30, // 估算行高
        left: rect.left + (currentColumn * 8) + 10 // 估算字符宽度
      })
      setShowMoodSelector(true)
    } else if (showMoodSelector) {
      // 如果输入了其他字符，隐藏心情选择器
      setShowMoodSelector(false)
    }
  }

  // 选择心情后的处理
  const handleMoodSelect = (moodId) => {
    // 移除最后的#符号，不添加任何文本
    const contentWithoutHash = content.slice(0, -1)
    setContent(contentWithoutHash)
    
    // 添加到心情列表
    if (!moods.includes(moodId)) {
      setMoods([...moods, moodId])
    }
    
    // 隐藏心情选择器
    setShowMoodSelector(false)
  }

  const handleSave = async () => {
    if (!content.trim()) {
      alert("请输入日志内容")
      return
    }

    if (hasAccounting && (!accountingAmount || !accountingCategory)) {
      alert("请填写完整的记账信息")
      return
    }

    setIsSaving(true)
    
    try {
      const now = new Date()
      const logData = {
        content: content.trim(),
        mood: moods.length > 0 ? moods : null, // 保存完整的心情数组
        images: images.map(img => img.url), // 直接保存base64字符串
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''), // 自动生成标题
      }

      let savedLog
      
      if (initialData) {
        // 更新现有日志
        const response = await logsApi.updateLog(initialData.id, logData)
        if (response.success) {
          savedLog = response.data
        } else {
          throw new Error(response.error)
        }
      } else {
        // 创建新日志
        const response = await logsApi.createLog(logData)
        if (response.success) {
          savedLog = response.data
        } else {
          throw new Error(response.error)
        }
      }

      // 如果有记账，保存记账记录
      if (hasAccounting && accountingAmount && accountingCategory) {
        const recordData = {
          type: accountingType,
          amount: parseFloat(accountingAmount),
          category: accountingCategory,
          date: now.toISOString().split('T')[0],
          description: accountingNote.trim() || content.trim(),
        }

        const response = await accountingApi.createRecord(recordData)
        if (!response.success) {
          console.error('保存记账记录失败:', response.error)
        }
      }
      
      // 调用父组件的保存回调
      if (onSave) {
        await onSave(savedLog)
      }
      
      // 重置表单
      if (!initialData) {
        setContent("")
        setMoods([])
        setImages([])
        setHasAccounting(false)
        setAccountingType('expense')
        setAccountingAmount("")
        setAccountingCategory("")
        setAccountingNote("")
      }
      
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败：' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 日志内容 - 集成图片和心情 */}
      <div className="relative">
        <Textarea
          placeholder="今天发生了什么有趣的事情？输入 # 选择心情"
          value={content}
          onChange={handleContentChange}
          style={{ 
            border: 'none', 
            boxShadow: 'none',
            letterSpacing: '2px',
            minHeight: '200px',
            maxHeight: '400px',
            height: 'auto',
            overflowY: content.length > 0 ? 'auto' : 'hidden'
          }}
          className="bg-gray-50 rounded-2xl p-4 text-base resize-none focus:shadow-none focus:bg-gray-100 transition-colors"
        />
        {/* 心情标签显示在左下角 */}
        {moods.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1">
            {moods.map((moodId) => {
              const mood = MOOD_TAGS.find(m => m.id === moodId)
              return (
                <span
                  key={moodId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700"
                >
                  {mood ? mood.emoji : "😊"} {mood ? mood.name : moodId}
                  <button
                    onClick={() => setMoods(moods.filter(id => id !== moodId))}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* 浮动心情选择器 */}
      {showMoodSelector && (
        <div 
          ref={moodSelectorRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{
            top: `${moodSelectorPosition.top}px`,
            left: `${moodSelectorPosition.left}px`,
          }}
        >
          <div className="flex flex-wrap gap-2 max-w-xs">
            {MOOD_TAGS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood.id)}
                className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span>{mood.emoji}</span>
                <span>{mood.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 图片上传 - 类似微信朋友圈 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => document.getElementById('image-input')?.click()}
          className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
        <span className="text-sm text-gray-500">添加图片</span>
        <input
          id="image-input"
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = Array.from(e.target.files).slice(0, 9 - images.length)
            files.forEach(file => {
              if (file.type.startsWith('image/')) {
                // 验证文件大小（限制为5MB）
                if (file.size > 5 * 1024 * 1024) {
                  alert(`图片 ${file.name} 太大，请选择小于5MB的图片`)
                  return
                }
                
                // 压缩图片
                compressImage(file, (compressedDataUrl) => {
                  const newImage = {
                    id: Date.now() + Math.random(),
                    file: file,
                    url: compressedDataUrl,
                    name: file.name
                  }
                  console.log('新图片对象:', newImage) // 调试日志
                  setImages([...images, newImage])
                })
              }
            })
          }}
          className="hidden"
        />
      </div>

      {/* 已上传的图片预览 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => {
            console.log('渲染图片:', image) // 调试日志
            return (
              <div key={image.id} className="relative group">
                <img
                  src={getImageUrl(image)}
                  alt={image.name}
                  className="w-40 h-40 object-cover rounded-xl"
                  onLoad={() => console.log('图片加载成功:', image.name)}
                  onError={(e) => {
                    console.error('图片加载失败:', image.name, 'src:', e.target.src, 'image对象:', image)
                    e.target.style.display = 'none'
                  }}
                />
                <button
                  onClick={() => setImages(images.filter(img => img.id !== image.id))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 记账功能 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">记账</span>
          <button
            onClick={() => setHasAccounting(!hasAccounting)}
            className={`ml-auto w-12 h-6 rounded-full transition-colors ${
              hasAccounting ? 'bg-gray-800' : 'bg-gray-200'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              hasAccounting ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {hasAccounting && (
          <div className="space-y-3 pl-7">
            {/* 收入/支出类型选择 */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setAccountingType('expense')
                  setAccountingCategory('') // 重置类别选择
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors ${
                  accountingType === 'expense'
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Minus className="h-4 w-4" />
                <span>支出</span>
              </button>
              <button
                onClick={() => {
                  setAccountingType('income')
                  setAccountingCategory('') // 重置类别选择
                }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors ${
                  accountingType === 'income'
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>收入</span>
              </button>
            </div>

            {/* 金额 */}
            <div className="flex items-center space-x-3">
              {accountingType === 'income' ? (
                <Plus className="h-4 w-4 text-green-500" />
              ) : (
                <Minus className="h-4 w-4 text-red-500" />
              )}
              <input
                type="number"
                step="0.01"
                placeholder="金额"
                value={accountingAmount}
                onChange={(e) => setAccountingAmount(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 rounded-full text-sm border-0 focus:outline-none focus:bg-gray-100 transition-colors"
              />
            </div>

            {/* 类别 */}
            <div className="flex flex-wrap gap-2">
              {(accountingType === 'income' ? ACCOUNTING_CATEGORIES.income : ACCOUNTING_CATEGORIES.expense).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setAccountingCategory(cat.id)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm transition-colors ${
                    accountingCategory === cat.id
                      ? accountingType === 'income' 
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* 备注 */}
            <input
              type="text"
              placeholder={`${accountingType === 'income' ? '收入' : '支出'}备注（可选）`}
              value={accountingNote}
              onChange={(e) => setAccountingNote(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 rounded-full text-sm border-0 focus:outline-none focus:bg-gray-100 transition-colors"
            />
          </div>
        )}
      </div>

    </div>
  )
})

export default LogForm

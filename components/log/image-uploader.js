"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ImageUploader({ images = [], onImagesChange, maxImages = 9 }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

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
      callback(compressedDataUrl)
    }
    
    img.src = URL.createObjectURL(file)
  }

  const handleFileSelect = (files) => {
    const newFiles = Array.from(files).slice(0, maxImages - images.length)
    
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        // 验证文件大小（限制为5MB）
        if (file.size > 20 * 1024 * 1024) {
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
          onImagesChange([...images, newImage])
        })
      }
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e) => {
    const files = e.target.files
    handleFileSelect(files)
  }

  const removeImage = (imageId) => {
    onImagesChange(images.filter(img => img.id !== imageId))
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <ImageIcon className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600">图片</span>
      </div>
      
      {/* 已上传的图片 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={getImageUrl(image)}
                alt={image.name}
                className="w-full h-20 object-cover rounded-xl"
                onError={(e) => {
                  console.error('图片上传器加载失败:', image.name, 'src:', e.target.src, 'image对象:', image)
                  e.target.style.display = 'none'
                }}
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      {images.length < maxImages && (
        <button
          onClick={openFileDialog}
          className="w-full h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          <div className="text-center">
            <Upload className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">添加图片</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </button>
      )}
    </div>
  )
}

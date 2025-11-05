"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ImageUploader({ images = [], onImagesChange, maxImages = 9 }) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  // 使用 ref 跟踪最新的 images，避免闭包问题
  const imagesRef = useRef(images)

  // 当 images prop 变化时，更新 ref
  useEffect(() => {
    imagesRef.current = images
  }, [images])

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
  const compressImage = (file, callback, onError) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
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
        
        // 释放对象URL
        URL.revokeObjectURL(objectUrl)
        
        callback(compressedDataUrl)
      } catch (error) {
        // 释放对象URL
        URL.revokeObjectURL(objectUrl)
        console.error('图片压缩处理失败:', error)
        if (onError) {
          onError(error)
        } else {
          callback(null)
        }
      }
    }
    
    img.onerror = (error) => {
      // 释放对象URL
      URL.revokeObjectURL(objectUrl)
      console.error('图片加载失败:', error)
      if (onError) {
        onError(new Error(`图片 ${file.name} 加载失败`))
      } else {
        callback(null)
      }
    }
    
    img.src = objectUrl
  }

  const handleFileSelect = (files) => {
    // 使用 ref 获取最新的 images，避免闭包问题
    const currentImages = imagesRef.current
    const newFiles = Array.from(files).slice(0, maxImages - currentImages.length)
    
    // 收集所有需要处理的文件
    const filesToProcess = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false
      }
      
      // 验证文件大小（限制为20MB）
      if (file.size > 20 * 1024 * 1024) {
        alert(`图片 ${file.name} 太大，请选择小于20MB的图片`)
        return false
      }
      
      return true
    })
    
    if (filesToProcess.length === 0) return
    
    // 使用 Promise 来处理所有文件的压缩
    const compressionPromises = filesToProcess.map((file, index) => {
      return new Promise((resolve, reject) => {
        compressImage(
          file,
          (compressedDataUrl) => {
            if (!compressedDataUrl) {
              reject(new Error(`图片 ${file.name} 压缩失败`))
              return
            }
            
            const newImage = {
              id: Date.now() + Math.random() + index * 1000 + Math.random() * file.size, // 更唯一的ID，确保多文件同时上传时不会重复
              file: file,
              url: compressedDataUrl,
              name: file.name
            }
            resolve(newImage)
          },
          (error) => {
            reject(error || new Error(`图片 ${file.name} 处理失败`))
          }
        )
      })
    })
    
    // 等待所有压缩完成后，统一更新状态
    // 使用 allSettled 而不是 all，这样即使部分图片失败，成功的图片也能被添加
    Promise.allSettled(compressionPromises)
      .then(results => {
        // 收集成功压缩的图片
        const compressedImages = []
        const errors = []
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const image = result.value
            if (image && image.id && image.url) {
              compressedImages.push(image)
            }
          } else {
            errors.push({
              file: filesToProcess[index]?.name || `文件 ${index + 1}`,
              error: result.reason
            })
            console.error(`图片 ${filesToProcess[index]?.name || index + 1} 处理失败:`, result.reason)
          }
        })
        
        // 如果有错误，提示用户
        if (errors.length > 0 && compressedImages.length === 0) {
          alert(`所有图片处理失败：${errors.map(e => e.file).join('、')}`)
          return
        } else if (errors.length > 0) {
          alert(`部分图片处理失败：${errors.map(e => e.file).join('、')}，已成功添加 ${compressedImages.length} 张图片`)
        }
        
        // 如果有成功的图片，添加到列表中
        if (compressedImages.length > 0) {
          // 获取最新的 images（使用 ref 避免闭包问题）
          const latestImages = imagesRef.current
          const validLatestImages = (latestImages || []).filter(img => img != null && img.id)
          const newImages = [...validLatestImages, ...compressedImages]
          
          // 使用最新值更新状态（由于我们使用 ref 跟踪最新值，可以直接更新）
          onImagesChange(newImages)
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
      {images.length > 0 && (() => {
        // 过滤掉 null 和无效的图片
        const validImages = images.filter(img => img != null && img.id && getImageUrl(img) !== '')
        if (validImages.length === 0) return null
        
        return (
          <div className="grid grid-cols-3 gap-2">
            {validImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={getImageUrl(image)}
                  alt={image?.name || '图片'}
                  className="w-full h-20 object-cover rounded-xl"
                  onError={(e) => {
                    console.error('图片上传器加载失败:', image?.name || '未知', 'src:', e.target.src, 'image对象:', image)
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
        )
      })()}

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

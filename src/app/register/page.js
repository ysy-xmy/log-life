'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除错误信息
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // 验证表单
    if (!formData.name.trim()) {
      setError('请输入姓名')
      return
    }
    
    if (!formData.email.trim()) {
      setError('请输入邮箱')
      return
    }
    
    if (!formData.password) {
      setError('请输入密码')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少6位')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 注册成功，跳转到登录页面
        router.push('/login?message=注册成功，请登录')
      } else {
        setError(data.error || '注册失败')
      }
    } catch (error) {
      console.error('注册失败:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">注册</h1>
        <div className="w-5"></div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">创建账户</h2>
          <p className="text-gray-600 text-sm">
            开始记录你的生活日志
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 姓名 */}
          <div>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="h-14 text-base border-0 border-b border-gray-200 rounded-none px-0 focus:border-gray-400 focus:ring-0"
              placeholder="姓名"
            />
          </div>
          
          {/* 邮箱 */}
          <div>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="h-14 text-base border-0 border-b border-gray-200 rounded-none px-0 focus:border-gray-400 focus:ring-0"
              placeholder="邮箱"
            />
          </div>
          
          {/* 密码 */}
          <div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="h-14 text-base border-0 border-b border-gray-200 rounded-none px-0 focus:border-gray-400 focus:ring-0"
              placeholder="密码（至少6位）"
            />
          </div>
          
          {/* 确认密码 */}
          <div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="h-14 text-base border-0 border-b border-gray-200 rounded-none px-0 focus:border-gray-400 focus:ring-0"
              placeholder="确认密码"
            />
          </div>
          
          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 text-base font-medium rounded-lg"
          >
            {loading ? '注册中...' : '创建账户'}
          </Button>
        </form>
        
        {/* 登录链接 */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            已有账户？{' '}
            <Link href="/login" className="text-gray-900 font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 检查是否有成功消息
    const successMessage = searchParams.get('message')
    if (successMessage) {
      setMessage(successMessage)
    }
  }, [searchParams])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // 清除错误信息
    if (error) setError('')
    if (message) setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    
    // 验证表单
    if (!formData.email.trim()) {
      setError('请输入邮箱')
      return
    }
    
    if (!formData.password) {
      setError('请输入密码')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 登录成功，使用认证上下文更新状态
        login(data.data.user, data.data.token)
        
        // 跳转到首页
        router.push('/')
      } else {
        setError(data.error || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">登录</h1>
        <div className="w-5"></div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Log Life</h2>
          <p className="text-gray-600 text-sm">
            记录生活的每一天
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {/* 隐藏的假输入框，用于防止自动填充 */}
          <div style={{ display: 'none' }}>
            <input type="text" name="fake-username" autoComplete="username" />
            <input type="password" name="fake-password" autoComplete="current-password" />
          </div>
          
          {/* 邮箱 */}
          <div>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={formData.email}
              onChange={handleInputChange}
              style={{
                border: 'none',
                boxShadow: 'none',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: 'transparent',
              }}
              className="h-14 text-base border-0 border-b-gray-200 rounded-none px-2"
              placeholder="邮箱"
            />
          </div>
          
          {/* 密码 */}
          <div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              required
              value={formData.password}
              onChange={handleInputChange}
              style={{
                border: 'none',
                boxShadow: 'none',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: 'transparent',
              }}
              className="h-14 text-base rounded-none px-2"
              placeholder="密码"
            />
          </div>
          
          {/* 成功消息 */}
          {message && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-600 text-sm">{message}</p>
            </div>
          )}
          
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
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
        
        {/* 注册链接 */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            还没有账户？{' '}
            <Link href="/register" className="text-gray-900 font-medium">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

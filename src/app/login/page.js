'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 返回按钮 */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回首页
          </Link>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              登录账户
            </CardTitle>
            <p className="text-gray-600 mt-2">
              欢迎回来，继续记录你的生活
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邮箱 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="请输入您的邮箱"
                  />
                </div>
              </div>
              
              {/* 密码 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="请输入密码"
                  />
                </div>
              </div>
              
              {/* 成功消息 */}
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{message}</p>
                </div>
              )}
              
              {/* 错误信息 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              {/* 提交按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
            
            {/* 注册链接 */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                还没有账户？{' '}
                <Link href="/register" className="text-gray-800 hover:text-gray-600 font-medium">
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

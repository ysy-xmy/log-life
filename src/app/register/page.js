'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Lock, ArrowLeft } from 'lucide-react'
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
              创建账户
            </CardTitle>
            <p className="text-gray-600 mt-2">
              开始记录你的生活日志
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 姓名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="请输入您的姓名"
                  />
                </div>
              </div>
              
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
                    placeholder="请输入密码（至少6位）"
                  />
                </div>
              </div>
              
              {/* 确认密码 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="请再次输入密码"
                  />
                </div>
              </div>
              
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
                {loading ? '注册中...' : '创建账户'}
              </Button>
            </form>
            
            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                已有账户？{' '}
                <Link href="/login" className="text-gray-800 hover:text-gray-600 font-medium">
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Smartphone, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { usePullRefresh } from "@/lib/use-pull-refresh"
import apiClient from "@/lib/api-client"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isAuthenticated, loading, getToken } = useAuth()
  const router = useRouter()
  const [userStats, setUserStats] = useState({
    totalLogs: 0,
    totalRecords: 0,
    joinDate: new Date().toISOString().split('T')[0]
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // 使用统一的 loading 管理
  const { loadingIndicator } = usePullRefresh(() => {}, 100, "加载中...")

  useEffect(() => {
    if (isAuthenticated()) {
      loadUserProfile()
      loadUserStats()
    }
  }, [isAuthenticated])

  // 从接口获取用户详细信息
  const loadUserProfile = async () => {
    setProfileLoading(true)
    setProfileError(null)
    
    try {
      const response = await apiClient.get('/auth/me')
      if (response.success) {
        // 更新本地存储的用户信息
        localStorage.setItem('user', JSON.stringify(response.data))
        // 这里可以触发 auth context 更新，但为了简化，我们直接使用响应数据
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setProfileError('获取用户信息失败')
    } finally {
      setProfileLoading(false)
    }
  }

  // 从接口获取用户统计数据
  const loadUserStats = async () => {
    try {
      // 获取日志和记账数据
      const [logsResponse, recordsResponse] = await Promise.all([
        apiClient.get('/logs'),
        apiClient.get('/accounting')
      ])
      
      setUserStats({
        totalLogs: logsResponse.success ? logsResponse.data.length : 0,
        totalRecords: recordsResponse.success ? recordsResponse.data.length : 0,
        joinDate: user?.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('加载用户统计失败:', error)
      // 如果接口失败，回退到本地存储
      try {
        const logs = JSON.parse(localStorage.getItem('logs') || '[]')
        const records = JSON.parse(localStorage.getItem('accounting_records') || '[]')
        
        setUserStats({
          totalLogs: logs.length,
          totalRecords: records.length,
          joinDate: user?.created_at ? new Date(user.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        })
      } catch (localError) {
        console.error('本地存储读取失败:', localError)
      }
    }
  }

  const handlePhoneLogin = () => {
    // 未来实现手机号登录功能
    alert('手机号登录功能即将上线，敬请期待！')
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      // 清除本地存储
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      // 刷新页面以更新认证状态
      window.location.reload()
    }
  }

  // 如果正在加载认证状态或用户信息
  if (loading || profileLoading) {
    return loadingIndicator
  }

  // 如果未登录，显示欢迎页面
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">欢迎使用 Log Life</h1>
          <p className="text-gray-600 mb-8">
            记录生活的每一天，开始你的日志之旅
          </p>
          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                注册新账户
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 h-full">
      {/* 顶部用户信息区域 */}
      <div className="bg-gray-800 px-4 pt-8 pb-6">
        {profileError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-200 text-sm">{profileError}</p>
            <button 
              onClick={loadUserProfile}
              className="text-red-200 text-xs underline mt-1"
            >
              重试
            </button>
          </div>
        )}
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
            <User className="h-10 w-10 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.name || '用户'}</h2>
            <p className="text-white/80 text-sm">{user?.email || '未设置邮箱'}</p>
            {user?.created_at && (
              <p className="text-white/60 text-xs mt-1">
                加入时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}
              </p>
            )}
          </div>
        </div>
        
        {/* 快速统计 */}
        <div className="flex space-x-4">
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{userStats.totalLogs}</div>
            <div className="text-white/80 text-xs">日志</div>
          </div>
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{userStats.totalRecords}</div>
            <div className="text-white/80 text-xs">记账</div>
          </div>
          <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {user?.created_at ? Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) : 0}
            </div>
            <div className="text-white/80 text-xs">天数</div>
          </div>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="px-4 py-4 space-y-3">

        {/* 关于应用 */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">关于应用</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3">
              <span className="text-gray-600">版本</span>
              <span className="text-gray-800 font-medium">v1.0.0</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-gray-600">开发者</span>
              <span className="text-gray-800 font-medium">小木鱼</span>
            </div>
            <div className="p-3">
              <p className="text-gray-600 text-sm leading-relaxed">
                一款简洁优雅的生活记录应用，帮助您记录美好时光，管理个人财务。
              </p>
            </div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="px-4 py-6">
          <button 
            onClick={handleLogout}
            className="w-full bg-gray-700 text-white font-medium py-4 rounded-2xl border border-gray-200 hover:bg-gray-700 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState('测试中...')
  const [error, setError] = useState(null)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // 测试 Supabase 连接
      const { data, error } = await supabase
        .from('logs')
        .select('count')
        .limit(1)

      if (error) {
        if (error.message.includes('relation "logs" does not exist')) {
          setConnectionStatus('✅ Supabase 连接成功，但 logs 表不存在')
          setError('请按照 SUPABASE_SETUP.md 中的说明创建数据库表')
        } else {
          setConnectionStatus('❌ Supabase 连接失败')
          setError(error.message)
        }
      } else {
        setConnectionStatus('✅ Supabase 连接成功，logs 表存在')
        setError(null)
      }
    } catch (err) {
      setConnectionStatus('❌ 连接测试失败')
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Supabase 连接测试
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">连接状态</h3>
            <p className="text-sm text-gray-600">{connectionStatus}</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">错误信息</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">下一步</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 检查 .env.local 文件中的环境变量</li>
              <li>• 在 Supabase 中创建数据库表</li>
              <li>• 配置行级安全策略</li>
            </ul>
          </div>

          <button
            onClick={testConnection}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            重新测试连接
          </button>
        </div>
      </div>
    </div>
  )
}

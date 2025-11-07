"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Calculator, Save, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ACCOUNTING_CATEGORIES, getTodayString, generateId } from "@/lib/data"
import { accountingApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

const AccountingForm = forwardRef(function AccountingForm({ onSave, initialData = null }, ref) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [type, setType] = useState(initialData?.type || 'expense')
  const [amount, setAmount] = useState(initialData?.amount || '')
  const [category, setCategory] = useState(initialData?.category || '')
  const [date, setDate] = useState(initialData?.date || getTodayString())
  const [note, setNote] = useState(initialData?.note || '')
  const [isSaving, setIsSaving] = useState(false)

  // 暴露保存方法给父组件
  useImperativeHandle(ref, () => ({
    handleSave: handleSave
  }))

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, router])

  const categories = type === 'income' ? ACCOUNTING_CATEGORIES.income : ACCOUNTING_CATEGORIES.expense

  const handleSave = async () => {
    // 确保用户已认证
    if (!isAuthenticated()) {
      console.warn('用户未认证，无法保存数据')
      return
    }
    
    if (!amount || !category) {
      alert("请填写金额和类别")
      return
    }

    setIsSaving(true)
    
    try {
      const recordData = {
        type,
        amount: parseFloat(amount),
        category,
        date,
        description: note.trim(),
      }

      let response
      
      if (initialData) {
        // 更新现有记录
        response = await accountingApi.updateRecord(initialData.id, recordData)
      } else {
        // 创建新记录
        response = await accountingApi.createRecord(recordData)
      }
      
      // 检查响应是否成功
      if (!response.success) {
        throw new Error(response.error || '保存失败')
      }
      
      // 调用父组件的保存回调，传递保存的记录数据
      if (onSave) {
        await onSave(response.data)
      }
      
      // 重置表单
      if (!initialData) {
        setAmount('')
        setCategory('')
        setNote('')
        setDate(getTodayString())
      }
      
    } catch (error) {
      console.error('保存记录失败:', error)
      // 如果是认证错误，重定向到登录页
      if (error.message.includes('认证') || error.message.includes('401')) {
        router.push('/login')
        return
      }
      alert(`保存失败: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
        {/* 收支类型 */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setType('expense')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-colors ${
                type === 'expense' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Minus className="h-5 w-5" />
              <span className="font-medium">支出</span>
            </button>
            <button
              onClick={() => setType('income')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl transition-colors ${
                type === 'income' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">收入</span>
            </button>
          </div>
        </div>

        {/* 金额 */}
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">¥</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-xl font-medium bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* 类别 */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center space-y-1 py-3 rounded-xl transition-colors ${
                  category === cat.id 
                    ? type === 'income' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 日期 */}
        <div className="space-y-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* 备注 */}
        <div className="space-y-3">
          <textarea
            placeholder="添加备注信息..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[80px] resize-none"
          />
        </div>

    </div>
  )
})

export default AccountingForm

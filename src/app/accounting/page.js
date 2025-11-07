"use client"

import { useState, useEffect, useRef } from "react"
import AccountingForm from "@/components/accounting/accounting-form"
import AccountingList from "@/components/accounting/accounting-list"
import { Calculator, Plus, List, ArrowLeft, Save } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePreventScroll } from "@/lib/use-prevent-scroll"
import { useRouter } from "next/navigation"

export default function AccountingPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [editingRecord, setEditingRecord] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [newRecord, setNewRecord] = useState(null)
  const [currentView, setCurrentView] = useState('list') // 'list' 或 'add'
  const accountingFormRef = useRef(null)

  // 启用全局防滚动穿透功能
  usePreventScroll(true)

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated()) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, router])

  const handleRecordSave = (savedRecord) => {
    setEditingRecord(null)
    setNewRecord(savedRecord) // 传递新保存的记录
    setCurrentView('list') // 保存后返回列表
  }

  const handleRecordEdit = (record) => {
    setEditingRecord(record)
    setCurrentView('add')
  }

  const handleRecordDelete = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleAddNew = () => {
    setEditingRecord(null)
    setCurrentView('add')
  }

  const handleBackToList = () => {
    setEditingRecord(null)
    setCurrentView('list')
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 如果正在加载认证状态，显示加载中 */}
      {authLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-500">验证身份中...</div>
        </div>
      ) : !isAuthenticated() ? (
        // 如果用户未认证，不渲染内容（会被重定向到登录页）
        null
      ) : (
        <>
          {/* 顶部导航 */}
          <div className="sticky flex-shrink-0 top-0 bg-white border-b border-gray-100 px-4 py-3 z-40">
            <div className="flex items-center justify-between">
              {currentView === 'add' ? (
                <button
                  onClick={handleBackToList}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-lg font-medium">返回</span>
                </button>
              ) : (
                <h1 className="text-xl font-semibold text-gray-800">记账</h1>
              )}
              
              {currentView === 'list' ? (
                <button
                  onClick={handleAddNew}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>记账</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (accountingFormRef.current) {
                      accountingFormRef.current.handleSave()
                    }
                  }}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingRecord ? '保存' : '确认'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 主要内容 - 可滚动区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
            {currentView === 'list' ? (
              <AccountingList 
                refreshTrigger={refreshKey}
                newRecord={newRecord}
                onEdit={handleRecordEdit}
                onDelete={handleRecordDelete}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calculator className="h-5 w-5 text-gray-500" />
                    <h2 className="text-lg font-medium text-gray-800">
                      {editingRecord ? '编辑记录' : '添加记录'}
                    </h2>
                  </div>
                  <AccountingForm 
                    ref={accountingFormRef}
                    onSave={handleRecordSave}
                    initialData={editingRecord}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

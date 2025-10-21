"use client"

import { useState } from "react"
import AccountingForm from "@/components/accounting/accounting-form"
import AccountingList from "@/components/accounting/accounting-list"
import { Calculator, Plus, List, ArrowLeft } from "lucide-react"

export default function AccountingPage() {
  const [editingRecord, setEditingRecord] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [newRecord, setNewRecord] = useState(null)
  const [currentView, setCurrentView] = useState('list') // 'list' 或 'add'

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
    <div className="bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 z-40">
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
          
          {currentView === 'list' && (
            <button
              onClick={handleAddNew}
              className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>记账</span>
            </button>
          )}
        </div>
      </div>

      {/* 主要内容 */}
      <div className="px-4 py-4">
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
                onSave={handleRecordSave}
                initialData={editingRecord}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

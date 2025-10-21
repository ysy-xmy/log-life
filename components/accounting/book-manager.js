"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, Edit, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { generateId, setData, getData } from "@/lib/data"

export default function BookManager({ onBookSelect, selectedBook }) {
  const [books, setBooks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = () => {
    try {
      const savedBooks = JSON.parse(localStorage.getItem('accounting_books') || '[]')
      setBooks(savedBooks)
      
      // 如果没有账本，创建一个默认账本
      if (savedBooks.length === 0) {
        const defaultBook = {
          id: generateId(),
          name: '个人账本',
          description: '我的个人收支记录',
          color: '#3B82F6',
          createdAt: new Date().toISOString(),
        }
        setBooks([defaultBook])
        setData('accounting_books', [defaultBook])
        if (onBookSelect) onBookSelect(defaultBook)
      } else if (onBookSelect && !selectedBook) {
        onBookSelect(savedBooks[0])
      }
    } catch (error) {
      console.error('加载账本失败:', error)
    }
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入账本名称')
      return
    }

    try {
      let updatedBooks
      
      if (editingBook) {
        // 更新现有账本
        updatedBooks = books.map(book => 
          book.id === editingBook.id 
            ? { ...book, ...formData, updatedAt: new Date().toISOString() }
            : book
        )
      } else {
        // 创建新账本
        const newBook = {
          id: generateId(),
          ...formData,
          createdAt: new Date().toISOString(),
        }
        updatedBooks = [newBook, ...books]
      }
      
      setBooks(updatedBooks)
      setData('accounting_books', updatedBooks)
      
      // 重置表单
      setFormData({ name: '', description: '', color: '#3B82F6' })
      setShowForm(false)
      setEditingBook(null)
      
    } catch (error) {
      console.error('保存账本失败:', error)
      alert('保存失败，请重试')
    }
  }

  const handleEdit = (book) => {
    setEditingBook(book)
    setFormData({
      name: book.name,
      description: book.description || '',
      color: book.color || '#3B82F6'
    })
    setShowForm(true)
  }

  const handleDelete = (bookId) => {
    if (books.length <= 1) {
      alert('至少需要保留一个账本')
      return
    }
    
    if (confirm('确定要删除这个账本吗？删除后无法恢复。')) {
      try {
        const updatedBooks = books.filter(book => book.id !== bookId)
        setBooks(updatedBooks)
        setData('accounting_books', updatedBooks)
        
        // 如果删除的是当前选中的账本，选择第一个账本
        if (selectedBook && selectedBook.id === bookId) {
          if (updatedBooks.length > 0) {
            onBookSelect(updatedBooks[0])
          }
        }
      } catch (error) {
        console.error('删除账本失败:', error)
        alert('删除失败，请重试')
      }
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' })
    setShowForm(false)
    setEditingBook(null)
  }

  return (
    <div className="space-y-6">
      {/* 账本列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>账本管理</span>
            </CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建账本
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <Card 
                key={book.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedBook?.id === book.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onBookSelect && onBookSelect(book)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: book.color }}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{book.name}</h3>
                        {book.description && (
                          <p className="text-sm text-gray-500 mt-1">{book.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(book)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(book.id)
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 新建/编辑账本表单 */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{editingBook ? '编辑账本' : '新建账本'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">账本名称</label>
              <Input
                placeholder="请输入账本名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">描述</label>
              <Textarea
                placeholder="请输入账本描述（可选）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">颜色</label>
              <div className="flex space-x-2">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'].map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleSave}>
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

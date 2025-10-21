import { NextResponse } from 'next/server'
import { accountingService } from '@/lib/supabase'
import { extractAuthFromRequest } from '@/lib/auth-utils'

// GET /api/accounting/[id] - 获取单个记账记录
export async function GET(request, { params }) {
  try {
    // 验证用户身份
    const authResult = extractAuthFromRequest(request)
    if (authResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error 
        },
        { status: authResult.status }
      )
    }
    
    const { userId } = authResult
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '记录ID不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 获取记录列表并找到指定ID的记录
    const records = await accountingService.getAccountingRecords(userId)
    const record = records.find(record => record.id === id)
    
    if (!record) {
      return NextResponse.json(
        { 
          success: false, 
          error: '记录不存在' 
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: record
    })
    
  } catch (error) {
    console.error('获取记账记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取记账记录失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// PUT /api/accounting/[id] - 更新记账记录
export async function PUT(request, { params }) {
  try {
    // 验证用户身份
    const authResult = extractAuthFromRequest(request)
    if (authResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error 
        },
        { status: authResult.status }
      )
    }
    
    const { userId } = authResult
    const { id } = params
    const body = await request.json()
    const { amount, category, description, type, date } = body
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '记录ID不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 验证必填字段
    if (!amount || !category || !type) {
      return NextResponse.json(
        { 
          success: false, 
          error: '金额、类别和类型不能为空' 
        },
        { status: 400 }
      )
    }
    
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '类型必须是 income 或 expense' 
        },
        { status: 400 }
      )
    }
    
    // 准备更新数据
    const updateData = {
      amount: parseFloat(amount),
      category,
      description: description || '',
      type,
      date: date || new Date().toISOString().split('T')[0],
    }
    
    // 更新记录
    const updatedRecord = await accountingService.updateAccountingRecord(id, updateData)
    
    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: '记账记录更新成功'
    })
    
  } catch (error) {
    console.error('更新记账记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '更新记账记录失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/accounting/[id] - 删除记账记录
export async function DELETE(request, { params }) {
  try {
    // 验证用户身份
    const authResult = extractAuthFromRequest(request)
    if (authResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error 
        },
        { status: authResult.status }
      )
    }
    
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '记录ID不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 删除记录
    await accountingService.deleteAccountingRecord(id)
    
    return NextResponse.json({
      success: true,
      message: '记账记录删除成功'
    })
    
  } catch (error) {
    console.error('删除记账记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '删除记账记录失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

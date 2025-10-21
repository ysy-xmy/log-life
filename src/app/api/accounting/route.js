import { NextResponse } from 'next/server'
import { accountingService } from '@/lib/supabase'
import { extractAuthFromRequest } from '@/lib/auth-utils'

// GET /api/accounting - 获取记账记录列表
export async function GET(request) {
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
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    let records
    
    if (year && month) {
      // 获取月度统计
      records = await accountingService.getMonthlyStats(userId, parseInt(year), parseInt(month))
    } else {
      // 获取所有记录
      records = await accountingService.getAccountingRecords(userId)
    }
    
    return NextResponse.json({
      success: true,
      data: records,
      total: records.length
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

// POST /api/accounting - 创建记账记录
export async function POST(request) {
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
    const body = await request.json()
    const { amount, category, description, type, date } = body
    
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
    
    // 准备记账数据
    const recordData = {
      user_id: userId, // 使用认证的用户ID
      amount: parseFloat(amount),
      category,
      description: description || '',
      type,
      date: date || new Date().toISOString().split('T')[0],
    }
    
    // 创建记账记录
    const newRecord = await accountingService.createAccountingRecord(recordData)
    
    return NextResponse.json({
      success: true,
      data: newRecord,
      message: '记账记录创建成功'
    }, { status: 201 })
    
  } catch (error) {
    console.error('创建记账记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '创建记账记录失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

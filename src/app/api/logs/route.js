import { NextResponse } from 'next/server'
import { logService, accountingService } from '@/lib/supabase'
import { extractAuthFromRequest } from '@/lib/auth-utils'

// GET /api/logs - 获取日志列表（支持分页）
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
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    
    // 获取总数（如果有搜索条件，需要先获取所有数据进行过滤）
    let total = 0
    let filteredLogs = []
    
    if (search.trim()) {
      // 如果有搜索条件，获取所有日志进行过滤（对于搜索，我们可能需要获取更多数据）
      const allLogs = await logService.getLogsWithAccounting(userId, 1, 1000) // 获取前1000条进行搜索
      const query = search.toLowerCase()
      filteredLogs = allLogs.filter(log => {
        const contentMatch = log.content.toLowerCase().includes(query)
        const titleMatch = log.title && log.title.toLowerCase().includes(query)
        
        // 检查心情匹配（支持数组和单个值）
        let moodMatch = false
        if (log.mood) {
          if (Array.isArray(log.mood)) {
            moodMatch = log.mood.some(moodId => 
              moodId.toLowerCase().includes(query)
            )
          } else if (typeof log.mood === 'string') {
            moodMatch = log.mood.toLowerCase().includes(query)
          }
        }
        
        return contentMatch || titleMatch || moodMatch
      })
      
      total = filteredLogs.length
      // 对搜索结果进行分页
      const from = (page - 1) * limit
      const to = from + limit
      filteredLogs = filteredLogs.slice(from, to)
    } else {
      // 没有搜索条件，使用数据库分页
      filteredLogs = await logService.getLogsWithAccounting(userId, page, limit)
      total = await logService.getLogsCount(userId)
    }
    
    return NextResponse.json({
      success: true,
      data: filteredLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    console.error('获取日志失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取日志失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// POST /api/logs - 创建新日志
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
    const { content, mood, images, title, accounting } = body
    
    // 验证必填字段
    if (!content || !content.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志内容不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 准备日志数据
    const logData = {
      user_id: userId,
      title: title || content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      content: content.trim(),
      mood: mood || null,
      images: images || [],
      created_at: new Date().toISOString()
    }
    
    // 如果有记账信息，先创建记账记录
    let accountingId = null
    if (accounting && accounting.enabled && accounting.amount && accounting.category) {
      try {
        const accountingData = {
          user_id: userId,
          type: accounting.type || 'expense',
          amount: parseFloat(accounting.amount),
          category: accounting.category,
          description: accounting.description || content.trim(),
          date: accounting.date || new Date().toISOString().split('T')[0],
        }
        
        console.log('创建日志时自动创建记账记录:', accountingData)
        const accountingRecord = await accountingService.createAccountingRecord(accountingData)
        accountingId = accountingRecord.id
        console.log('自动创建记账记录成功:', accountingRecord.id)
      } catch (error) {
        console.error('创建记账记录失败:', error)
        // 记账失败不影响日志创建，继续执行
        console.log('记账记录创建失败，但继续创建日志')
      }
    }
    
    // 将记账ID添加到日志数据中
    if (accountingId) {
      logData.accounting_id = accountingId
    }
    
    // 创建日志
    const newLog = await logService.createLog(logData)
    
    return NextResponse.json({
      success: true,
      data: newLog,
      message: '日志创建成功',
      accountingId: accountingId // 返回记账ID供前端使用
    }, { status: 201 })
    
  } catch (error) {
    console.error('创建日志失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '创建日志失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

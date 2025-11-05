import { NextResponse } from 'next/server'
import { logService, accountingService } from '@/lib/supabase'

// GET /api/logs/[id] - 获取单个日志
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志ID不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 从认证头获取用户ID
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '需要登录' 
        },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    let userId
    
    try {
      // 解析token，格式为 userId:timestamp
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [parsedUserId] = decoded.split(':')
      userId = parsedUserId
    } catch (error) {
      // 如果解析失败，可能是直接的userId
      userId = token
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的认证令牌' 
        },
        { status: 401 }
      )
    }
    
    // 直接根据ID获取日志（更高效且准确）
    const log = await logService.getLogWithAccounting(id, userId)
    
    if (!log) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志不存在' 
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: log
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

// PUT /api/logs/[id] - 更新日志
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content, mood, images, title, accounting } = body
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志ID不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 从认证头获取用户ID
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '需要登录' 
        },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    let userId
    
    try {
      // 解析token，格式为 userId:timestamp
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [parsedUserId] = decoded.split(':')
      userId = parsedUserId
    } catch (error) {
      // 如果解析失败，可能是直接的userId
      userId = token
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的认证令牌' 
        },
        { status: 401 }
      )
    }
    
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
    
    // 获取当前日志信息（直接根据ID查询）
    const currentLog = await logService.getLogWithAccounting(id, userId)
    
    if (!currentLog) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志不存在' 
        },
        { status: 404 }
      )
    }
    
    // 处理记账信息
    let accountingId = currentLog.accounting_id
    
    if (accounting && accounting.enabled && accounting.amount && accounting.category) {
      // 需要创建或更新记账记录
      const accountingData = {
        user_id: userId, // 添加user_id字段
        type: accounting.type,
        amount: parseFloat(accounting.amount),
        category: accounting.category,
        description: accounting.description || content.trim(),
        date: accounting.date || new Date().toISOString().split('T')[0]
      }
      
      try {
        if (currentLog.accounting_id) {
          // 更新现有记账记录
          console.log('更新现有记账记录:', currentLog.accounting_id, accountingData)
          await accountingService.updateAccountingRecord(currentLog.accounting_id, accountingData)
        } else {
          // 创建新的记账记录
          console.log('创建新的记账记录:', accountingData)
          const newAccounting = await accountingService.createAccountingRecord(accountingData)
          accountingId = newAccounting.id
          console.log('记账记录创建成功:', accountingId)
        }
      } catch (accountingError) {
        console.error('处理记账信息失败:', accountingError)
        // 记账失败不影响日志更新，但需要记录错误
        return NextResponse.json(
          { 
            success: false, 
            error: '记账信息处理失败',
            message: accountingError.message,
            details: '请检查accounting表是否存在且结构正确'
          },
          { status: 500 }
        )
      }
    } else if (currentLog.accounting_id) {
      // 如果原来有记账记录但现在不需要了，删除记账记录
      try {
        console.log('删除记账记录:', currentLog.accounting_id)
        await accountingService.deleteAccountingRecord(currentLog.accounting_id)
        accountingId = null
      } catch (deleteError) {
        console.error('删除记账记录失败:', deleteError)
        // 删除失败不影响日志更新
      }
    }
    
    // 准备更新数据
    const updateData = {
      title: title || content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      content: content.trim(),
      mood: mood || null,
      images: images || [],
      accounting_id: accountingId
    }
    
    // 更新日志
    const updatedLog = await logService.updateLog(id, updateData)
    
    return NextResponse.json({
      success: true,
      data: updatedLog,
      message: '日志更新成功'
    })
    
  } catch (error) {
    console.error('更新日志失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '更新日志失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/logs/[id] - 删除日志
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志ID不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 从认证头获取用户ID
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '需要登录' 
        },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    let userId
    
    try {
      // 解析token，格式为 userId:timestamp
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [parsedUserId] = decoded.split(':')
      userId = parsedUserId
    } catch (error) {
      // 如果解析失败，可能是直接的userId
      userId = token
    }
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的认证令牌' 
        },
        { status: 401 }
      )
    }
    
    // 验证日志是否属于当前用户（直接根据ID查询，更高效）
    const log = await logService.getLogWithAccounting(id, userId)
    
    if (!log) {
      return NextResponse.json(
        { 
          success: false, 
          error: '日志不存在或无权限删除' 
        },
        { status: 404 }
      )
    }
    
    // 删除日志
    await logService.deleteLog(id)
    
    return NextResponse.json({
      success: true,
      message: '日志删除成功'
    })
    
  } catch (error) {
    console.error('删除日志失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '删除日志失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

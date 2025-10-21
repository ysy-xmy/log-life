import { NextResponse } from 'next/server'
import { logService } from '@/lib/supabase'

// GET /api/logs/[id] - 获取单个日志
export async function GET(request, { params }) {
  try {
    const { id } = params
    
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
    
    // 获取日志列表并找到指定ID的日志
    const logs = await logService.getLogs(userId)
    const log = logs.find(log => log.id === id)
    
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
    const { id } = params
    const body = await request.json()
    const { content, mood, images, title } = body
    
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
    
    // 准备更新数据
    const updateData = {
      title: title || content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      content: content.trim(),
      mood: mood || null,
      images: images || [],
      updated_at: new Date().toISOString()
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
    const { id } = params
    
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
    
    // 验证日志是否属于当前用户
    const logs = await logService.getLogs(userId)
    const log = logs.find(log => log.id === id)
    
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

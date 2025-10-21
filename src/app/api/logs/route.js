import { NextResponse } from 'next/server'
import { logService } from '@/lib/supabase'

// GET /api/logs - 获取日志列表
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
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
    
    // 获取所有日志
    const logs = await logService.getLogs(userId)
    
    // 如果有搜索条件，进行过滤
    let filteredLogs = logs
    if (search.trim()) {
      const query = search.toLowerCase()
      filteredLogs = logs.filter(log => {
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
    }
    
    return NextResponse.json({
      success: true,
      data: filteredLogs,
      total: filteredLogs.length
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
    const body = await request.json()
    const { content, mood, images, title } = body
    
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
    
    // 准备日志数据
    const logData = {
      user_id: userId,
      title: title || content.slice(0, 50) + (content.length > 50 ? '...' : ''),
      content: content.trim(),
      mood: mood || null,
      images: images || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 创建日志
    const newLog = await logService.createLog(logData)
    
    return NextResponse.json({
      success: true,
      data: newLog,
      message: '日志创建成功'
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

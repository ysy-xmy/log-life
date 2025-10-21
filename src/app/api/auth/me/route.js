import { NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'

// GET /api/auth/me - 获取当前用户信息
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少认证令牌' 
        },
        { status: 401 }
      )
    }
    
    // 解析token（简化版本）
    const token = authHeader.substring(7)
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: '无效的认证令牌' 
        },
        { status: 401 }
      )
    }
    
    // 获取用户信息
    const user = await userService.getUser(userId)
    
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    })
    
  } catch (error) {
    console.error('获取用户信息失败:', error)
    
    if (error.message.includes('No rows found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '用户不存在' 
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '获取用户信息失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

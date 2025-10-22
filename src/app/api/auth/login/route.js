import { NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'
import crypto from 'crypto'

// POST /api/auth/login - 用户登录
export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: '邮箱和密码不能为空' 
        },
        { status: 400 }
      )
    }
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '邮箱格式不正确' 
        },
        { status: 400 }
      )
    }
    
    // 根据邮箱获取用户
    const user = await userService.getUserByEmail(email)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: '账号或密码错误' 
        },
        { status: 401 }
      )
    }
    
    // 验证密码 - 使用 MD5 比较
    const passwordHash = crypto.createHash('md5').update(password).digest('hex')
    if (!user.password_hash || user.password_hash !== passwordHash) {
      return NextResponse.json(
        { 
          success: false, 
          error: '账号或密码错误' 
        },
        { status: 401 }
      )
    }
    
    // 生成简单的会话token（实际项目中应该使用JWT）
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        },
        token: sessionToken
      },
      message: '登录成功'
    })
    
  } catch (error) {
    console.error('用户登录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '登录失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

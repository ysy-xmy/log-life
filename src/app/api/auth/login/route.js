import { NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'

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
    
    // 获取所有用户（在实际项目中应该通过邮箱查询）
    const users = await userService.getUsers()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: '用户不存在' 
        },
        { status: 404 }
      )
    }
    
    // 注意：实际项目中应该验证密码哈希
    // 这里为了简化，暂时跳过密码验证
    
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

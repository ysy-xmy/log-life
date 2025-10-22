import { NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// POST /api/auth/register - 用户注册
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password } = body
    
    // 验证必填字段
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: '昵称、邮箱和密码不能为空' 
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
    
    // 密码长度验证
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: '密码长度至少6位' 
        },
        { status: 400 }
      )
    }
    
    // 生成用户ID
    const userId = uuidv4()
    
    // 使用 MD5 加密密码
    const passwordHash = crypto.createHash('md5').update(password).digest('hex')
    
    // 准备用户数据
    const userData = {
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      password_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // 创建用户
    const newUser = await userService.upsertUser(userData)
    
    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: newUser.created_at
      },
      message: '注册成功'
    }, { status: 201 })
    
  } catch (error) {
    console.error('用户注册失败:', error)
    
    // 处理邮箱重复错误
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '该邮箱已被注册' 
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '注册失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

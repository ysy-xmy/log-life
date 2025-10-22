import { NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'
import { extractAuthFromRequest } from '@/lib/auth-utils'
import crypto from 'crypto'

// PUT /api/auth/profile - 更新用户信息
export async function PUT(request) {
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
    const { name, email, currentPassword, newPassword } = body
    
    // 获取当前用户信息
    const currentUser = await userService.getUser(userId)
    if (!currentUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: '用户不存在' 
        },
        { status: 404 }
      )
    }
    
    // 准备更新数据
    const updateData = {
      id: userId,
      updated_at: new Date().toISOString()
    }
    
    // 更新姓名
    if (name && name.trim()) {
      updateData.name = name.trim()
    }
    
    // 更新邮箱
    if (email && email.trim()) {
      // 验证邮箱格式
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
      updateData.email = email.toLowerCase().trim()
    }
    
    // 更新密码
    if (newPassword && newPassword.trim()) {
      // 验证新密码长度
      if (newPassword.length < 6) {
        return NextResponse.json(
          { 
            success: false, 
            error: '新密码长度至少6位' 
          },
          { status: 400 }
        )
      }
      
      // 验证当前密码
      if (!currentPassword) {
        return NextResponse.json(
          { 
            success: false, 
            error: '请输入当前密码' 
          },
          { status: 400 }
        )
      }
      
      const currentPasswordHash = crypto.createHash('md5').update(currentPassword).digest('hex')
      if (!currentUser.password_hash || currentUser.password_hash !== currentPasswordHash) {
        return NextResponse.json(
          { 
            success: false, 
            error: '当前密码错误' 
          },
          { status: 401 }
        )
      }
      
      // 更新密码
      const newPasswordHash = crypto.createHash('md5').update(newPassword).digest('hex')
      updateData.password_hash = newPasswordHash
      updateData.password_updated_at = new Date().toISOString()
    }
    
    // 更新用户信息
    const updatedUser = await userService.upsertUser(updateData)
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      },
      message: '用户信息更新成功'
    })
    
  } catch (error) {
    console.error('更新用户信息失败:', error)
    
    // 处理邮箱重复错误
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      return NextResponse.json(
        { 
          success: false, 
          error: '该邮箱已被使用' 
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '更新用户信息失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

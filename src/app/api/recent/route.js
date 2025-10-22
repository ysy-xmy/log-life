import { NextResponse } from 'next/server'
import { recentService } from '@/lib/supabase'
import { extractAuthFromRequest } from '@/lib/auth-utils'

// GET /api/recent - 获取最近的三条记录（日志和记账数据）
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
    const limit = parseInt(searchParams.get('limit')) || 3
    
    // 获取最近记录
    const recentRecords = await recentService.getRecentRecords(userId, limit)
    
    return NextResponse.json({
      success: true,
      data: recentRecords,
      total: recentRecords.length
    })
  } catch (error) {
    console.error('获取最近记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取最近记录失败',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

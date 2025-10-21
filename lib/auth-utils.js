// 认证工具函数

/**
 * 验证JWT token并提取用户ID
 * @param {string} token - JWT token
 * @returns {string|null} - 用户ID或null
 */
export function validateToken(token) {
  if (!token) return null
  
  try {
    // 简化的token解析（实际项目中应使用更安全的方法）
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId] = decoded.split(':')
    return userId || null
  } catch (error) {
    console.error('Token解析失败:', error)
    return null
  }
}

/**
 * 从请求头中提取并验证认证信息
 * @param {Request} request - Next.js请求对象
 * @returns {Object} - { userId: string } 或 { error: string, status: number }
 */
export function extractAuthFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: '缺少认证令牌', status: 401 }
  }
  
  const token = authHeader.substring(7)
  const userId = validateToken(token)
  
  if (!userId) {
    return { error: '无效的认证令牌', status: 401 }
  }
  
  return { userId }
}

/**
 * 检查用户是否有权限访问特定资源
 * @param {string} userId - 当前用户ID
 * @param {string} resourceUserId - 资源所属用户ID
 * @returns {boolean} - 是否有权限
 */
export function hasPermission(userId, resourceUserId) {
  return userId === resourceUserId
}

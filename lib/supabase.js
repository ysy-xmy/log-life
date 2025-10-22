import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  LOGS: 'logs',
  ACCOUNTING: 'accounting',
  USERS: 'users'
}

// 日志相关操作
export const logService = {
  // 获取所有日志
  async getLogs(userId) {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 创建新日志
  async createLog(logData) {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .insert([logData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 获取带记账信息的日志
  async getLogsWithAccounting(userId) {
    try {
      // 先尝试获取带accounting_id的日志
      const { data: logs, error: logsError } = await supabase
        .from(TABLES.LOGS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (logsError) throw logsError
      
      // 检查是否有accounting_id字段
      const hasAccountingId = logs.length > 0 && logs[0].hasOwnProperty('accounting_id')
      
      if (!hasAccountingId) {
        console.warn('accounting_id字段不存在，返回不带记账信息的日志')
        return logs
      }
      
      // 获取所有相关的记账记录
      const accountingIds = logs
        .filter(log => log.accounting_id)
        .map(log => log.accounting_id)
      
      let accountingRecords = []
      if (accountingIds.length > 0) {
        const { data: accounting, error: accountingError } = await supabase
          .from(TABLES.ACCOUNTING)
          .select('*')
          .in('id', accountingIds)
        
        if (accountingError) {
          console.error('获取记账记录失败:', accountingError)
        } else {
          accountingRecords = accounting || []
        }
      }
      
      // 将记账信息合并到日志中
      const logsWithAccounting = logs.map(log => {
        if (log.accounting_id) {
          const accounting = accountingRecords.find(acc => acc.id === log.accounting_id)
          return {
            ...log,
            accounting: accounting || null
          }
        }
        return log
      })
      
      return logsWithAccounting
    } catch (error) {
      console.error('获取带记账信息的日志失败，回退到普通查询:', error)
      // 回退到普通查询
      return this.getLogs(userId)
    }
  },

  // 更新日志
  async updateLog(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 删除日志
  async deleteLog(id) {
    const { error } = await supabase
      .from(TABLES.LOGS)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 记账相关操作
export const accountingService = {
  // 获取所有记账记录
  async getAccountingRecords(userId) {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTING)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 创建记账记录
  async createAccountingRecord(recordData) {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTING)
      .insert([recordData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 更新记账记录
  async updateAccountingRecord(id, updates) {
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTING)
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 删除记账记录
  async deleteAccountingRecord(id) {
    const { error } = await supabase
      .from(TABLES.ACCOUNTING)
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 获取月度统计
  async getMonthlyStats(userId, year, month) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    const { data, error } = await supabase
      .from(TABLES.ACCOUNTING)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
    
    if (error) throw error
    return data
  }
}

// 最近记录相关操作
export const recentService = {
  // 获取最近的三条日志记录（带记账信息）
  async getRecentRecords(userId, limit = 3) {
    try {
      // 获取最近的日志
      const { data: logs, error: logsError } = await supabase
        .from(TABLES.LOGS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (logsError) throw logsError
      
      // 检查是否有accounting_id字段
      const hasAccountingId = logs.length > 0 && logs[0].hasOwnProperty('accounting_id')
      
      if (!hasAccountingId) {
        console.warn('accounting_id字段不存在，返回不带记账信息的日志')
        return logs || []
      }
      
      // 获取所有相关的记账记录
      const accountingIds = logs
        .filter(log => log.accounting_id)
        .map(log => log.accounting_id)
      
      let accountingRecords = []
      if (accountingIds.length > 0) {
        const { data: accounting, error: accountingError } = await supabase
          .from(TABLES.ACCOUNTING)
          .select('*')
          .in('id', accountingIds)
        
        if (accountingError) {
          console.error('获取记账记录失败:', accountingError)
        } else {
          accountingRecords = accounting || []
        }
      }
      
      // 将记账信息合并到日志中
      const logsWithAccounting = logs.map(log => {
        if (log.accounting_id) {
          const accounting = accountingRecords.find(acc => acc.id === log.accounting_id)
          return {
            ...log,
            accounting: accounting || null
          }
        }
        return log
      })
      
      return logsWithAccounting
    } catch (error) {
      console.error('获取最近记录失败:', error)
      throw error
    }
  }
}

// 用户相关操作
export const userService = {
  // 获取用户信息
  async getUser(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // 获取所有用户（用于登录验证）
  async getUsers() {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 根据邮箱获取用户
  async getUserByEmail(email) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 表示没有找到记录
    return data
  },

  // 创建或更新用户
  async upsertUser(userData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .upsert([userData])
      .select()
    
    if (error) throw error
    return data[0]
  }
}

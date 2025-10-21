// API 客户端工具类
class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  // 获取认证头
  getAuthHeaders() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    }
    return {}
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || '请求失败')
      }

      return data
    } catch (error) {
      console.error(`API 请求失败 [${endpoint}]:`, error)
      throw error
    }
  }

  // GET 请求
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params)
    const queryString = searchParams.toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }

  // POST 请求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT 请求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE 请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// 创建默认实例
const apiClient = new ApiClient()

// 日志相关 API
export const logsApi = {
  // 获取日志列表
  async getLogs(search = '') {
    return apiClient.get('/logs', { search })
  },

  // 获取单个日志
  async getLog(id) {
    return apiClient.get(`/logs/${id}`)
  },

  // 创建日志
  async createLog(logData) {
    return apiClient.post('/logs', logData)
  },

  // 更新日志
  async updateLog(id, logData) {
    return apiClient.put(`/logs/${id}`, logData)
  },

  // 删除日志
  async deleteLog(id) {
    return apiClient.delete(`/logs/${id}`)
  },
}

// 记账相关 API
export const accountingApi = {
  // 获取记账记录
  async getRecords() {
    return apiClient.get('/accounting')
  },

  // 创建记账记录
  async createRecord(recordData) {
    return apiClient.post('/accounting', recordData)
  },

  // 更新记账记录
  async updateRecord(id, recordData) {
    return apiClient.put(`/accounting/${id}`, recordData)
  },

  // 删除记账记录
  async deleteRecord(id) {
    return apiClient.delete(`/accounting/${id}`)
  },

  // 获取月度统计
  async getMonthlyStats(year, month) {
    return apiClient.get('/accounting', { year, month })
  },
}

export default apiClient

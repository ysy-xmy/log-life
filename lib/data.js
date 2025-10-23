// 数据管理工具函数

// 从localStorage获取数据
export function getData(key, defaultValue = null) {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error getting data from localStorage:', error);
    return defaultValue;
  }
}

// 保存数据到localStorage
export function setData(key, value) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
}

// 删除数据
export function removeData(key) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing data from localStorage:', error);
  }
}

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化日期
export function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 格式化时间
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 获取今天的日期字符串
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// 心情标签配置
export const MOOD_TAGS = [
  { id: 'happy', name: '开心', color: 'bg-yellow-100 text-yellow-800', emoji: '😊' },
  { id: 'sad', name: '难过', color: 'bg-gray-100 text-gray-700', emoji: '😢' },
  { id: 'angry', name: '愤怒', color: 'bg-red-100 text-red-800', emoji: '😠' },
  { id: 'calm', name: '平静', color: 'bg-green-100 text-green-800', emoji: '😌' },
  { id: 'excited', name: '兴奋', color: 'bg-orange-100 text-orange-800', emoji: '🤩' },
  { id: 'anxious', name: '焦虑', color: 'bg-purple-100 text-purple-800', emoji: '😰' },
  { id: 'tired', name: '疲惫', color: 'bg-gray-100 text-gray-800', emoji: '😴' },
  { id: 'grateful', name: '感恩', color: 'bg-pink-100 text-pink-800', emoji: '🙏' },
];

// 记账类别配置
export const ACCOUNTING_CATEGORIES = {
  income: [
    { id: 'salary', name: '工资', icon: '💰' },
    { id: 'bonus', name: '奖金', icon: '🎁' },
    { id: 'investment', name: '投资', icon: '📈' },
    { id: 'other_income', name: '其他收入', icon: '💵' },
  ],
  expense: [
    { id: 'food', name: '餐饮', icon: '🍽️' },
    { id: 'shopping', name: '购物', icon: '🛍️' },
    { id: 'transport', name: '交通', icon: '🚗' },
    { id: 'entertainment', name: '娱乐', icon: '🎬' },
    { id: 'health', name: '医疗', icon: '🏥' },
    { id: 'housing', name: '住房', icon: '🏠' },
    { id: 'utilities', name: '水电费', icon: '⚡' },
    { id: 'education', name: '教育', icon: '📚' },
    { id: 'other_expense', name: '其他支出', icon: '💸' },
  ],
};

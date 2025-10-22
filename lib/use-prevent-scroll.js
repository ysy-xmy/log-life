"use client"

import { useEffect, useRef } from 'react'

// 全局状态管理输入框焦点状态
let isInputFocused = false
const focusListeners = new Set()

// 通知所有监听器焦点状态变化
const notifyFocusChange = (focused) => {
  isInputFocused = focused
  focusListeners.forEach(listener => listener(focused))
}

/**
 * 防止移动端键盘弹起时页面滚动穿透的自定义hook
 * @param {boolean} enabled - 是否启用防滚动功能
 */
export function usePreventScroll(enabled = true) {
  const originalStyle = useRef(null)
  const scrollPosition = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const body = document.body
    const html = document.documentElement

    // 保存原始样式
    originalStyle.current = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
    }

    // 监听输入框焦点事件
    const handleFocusIn = (event) => {
      const target = event.target
      
      // 检查是否是输入框元素
      const isInputElement = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' ||
                            target.contentEditable === 'true' ||
                            target.getAttribute('contenteditable') === 'true'

      if (isInputElement) {
        // 设置全局焦点状态
        notifyFocusChange(true)
        
        // 保存当前滚动位置
        scrollPosition.current = window.pageYOffset || document.documentElement.scrollTop
        
        // 应用防滚动样式
        body.style.overflow = 'hidden'
        body.style.position = 'fixed'
        body.style.top = `-${scrollPosition.current}px`
        body.style.width = '100%'
        
        html.style.overflow = 'hidden'
        
        console.log('键盘弹起，应用防滚动样式，禁用手势')
      }
    }

    // 监听输入框失焦事件
    const handleFocusOut = (event) => {
      const target = event.target
      
      // 检查是否是输入框元素
      const isInputElement = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' ||
                            target.contentEditable === 'true' ||
                            target.getAttribute('contenteditable') === 'true'

      if (isInputElement) {
        // 延迟恢复，确保键盘完全收起
        setTimeout(() => {
          // 清除全局焦点状态
          notifyFocusChange(false)
          
          // 恢复原始样式
          body.style.overflow = originalStyle.current.bodyOverflow || ''
          body.style.position = originalStyle.current.bodyPosition || ''
          body.style.top = originalStyle.current.bodyTop || ''
          body.style.width = originalStyle.current.bodyWidth || ''
          
          html.style.overflow = originalStyle.current.htmlOverflow || ''
          
          // 恢复滚动位置
          window.scrollTo(0, scrollPosition.current)
          
          console.log('键盘收起，恢复滚动样式，启用手势')
        }, 100)
      }
    }

    // 监听虚拟键盘弹起/收起事件（iOS Safari）
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const initialHeight = window.screen.height
      
      // 如果高度变化超过150px，认为是键盘弹起/收起
      if (Math.abs(currentHeight - initialHeight) > 150) {
        if (currentHeight < initialHeight) {
          // 键盘弹起
          notifyFocusChange(true)
          scrollPosition.current = window.pageYOffset || document.documentElement.scrollTop
          body.style.overflow = 'hidden'
          body.style.position = 'fixed'
          body.style.top = `-${scrollPosition.current}px`
          body.style.width = '100%'
          html.style.overflow = 'hidden'
          console.log('检测到键盘弹起（resize事件），禁用手势')
        } else {
          // 键盘收起
          notifyFocusChange(false)
          body.style.overflow = originalStyle.current.bodyOverflow || ''
          body.style.position = originalStyle.current.bodyPosition || ''
          body.style.top = originalStyle.current.bodyTop || ''
          body.style.width = originalStyle.current.bodyWidth || ''
          html.style.overflow = originalStyle.current.htmlOverflow || ''
          window.scrollTo(0, scrollPosition.current)
          console.log('检测到键盘收起（resize事件），启用手势')
        }
      }
    }

    // 添加事件监听器
    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('focusout', handleFocusOut, true)
    window.addEventListener('resize', handleResize)

    // 清理函数
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true)
      document.removeEventListener('focusout', handleFocusOut, true)
      window.removeEventListener('resize', handleResize)
      
      // 恢复原始样式
      if (originalStyle.current) {
        body.style.overflow = originalStyle.current.bodyOverflow || ''
        body.style.position = originalStyle.current.bodyPosition || ''
        body.style.top = originalStyle.current.bodyTop || ''
        body.style.width = originalStyle.current.bodyWidth || ''
        html.style.overflow = originalStyle.current.htmlOverflow || ''
      }
      
      // 清除全局焦点状态
      notifyFocusChange(false)
    }
  }, [enabled])
}

/**
 * 手动控制页面滚动的hook
 * @param {boolean} preventScroll - 是否阻止滚动
 */
export function useManualScrollControl(preventScroll = false) {
  useEffect(() => {
    if (!preventScroll) return

    const body = document.body
    const html = document.documentElement
    const originalBodyOverflow = body.style.overflow
    const originalHtmlOverflow = html.style.overflow
    
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    
    return () => {
      body.style.overflow = originalBodyOverflow || ''
      html.style.overflow = originalHtmlOverflow || ''
    }
  }, [preventScroll])
}

/**
 * 监听输入框焦点状态的hook
 * @param {function} callback - 焦点状态变化时的回调函数
 */
export function useInputFocusListener(callback) {
  useEffect(() => {
    focusListeners.add(callback)
    
    return () => {
      focusListeners.delete(callback)
    }
  }, [callback])
}

/**
 * 获取当前输入框焦点状态
 * @returns {boolean} 是否在输入框焦点状态
 */
export function getInputFocusState() {
  return isInputFocused
}
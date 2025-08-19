import { useState, useEffect, useCallback, useRef } from 'react'
import { PptPuzzleState } from '@/lib/types/ppt-puzzle'

const STORAGE_KEY = 'ppt-puzzle-state'
const MAX_HISTORY_SIZE = 50

interface HistoryState {
  past: PptPuzzleState[]
  present: PptPuzzleState
  future: PptPuzzleState[]
}

export function usePuzzleState(initialState: PptPuzzleState) {
  // 从localStorage加载状态
  const loadFromStorage = (): PptPuzzleState => {
    if (typeof window === 'undefined') return initialState
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // 恢复图片的URL（base64格式的会被保存）
        return {
          ...parsed,
          showPuzzle: false, // 重置显示状态
          currentBatchIndex: 0, // 重置批次索引
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    
    return initialState
  }

  // 历史记录管理
  const [history, setHistory] = useState<HistoryState>(() => ({
    past: [],
    present: loadFromStorage(),
    future: []
  }))

  // 保存到localStorage（防抖处理）
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  
  const saveToStorage = useCallback((state: PptPuzzleState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // 过滤掉File对象，只保存必要的数据
        const toSave = {
          ...state,
          images: state.images.map(img => ({
            ...img,
            file: undefined // 不保存File对象
          })),
          mainImages: state.mainImages.map(img => ({
            ...img,
            file: undefined
          })),
          subImages: state.subImages.map(img => ({
            ...img,
            file: undefined
          }))
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    }, 500) // 500ms防抖
  }, [])

  // 设置新状态
  const setState = useCallback((newState: PptPuzzleState | ((prev: PptPuzzleState) => PptPuzzleState)) => {
    setHistory(prev => {
      const nextState = typeof newState === 'function' 
        ? newState(prev.present) 
        : newState
      
      // 如果状态没有实质变化，不添加到历史记录
      if (JSON.stringify(prev.present) === JSON.stringify(nextState)) {
        return prev
      }
      
      // 添加到历史记录
      const newPast = [...prev.past, prev.present]
      
      // 限制历史记录大小
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift()
      }
      
      return {
        past: newPast,
        present: nextState,
        future: [] // 新操作会清空future
      }
    })
  }, [])

  // 撤销
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev
      
      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, prev.past.length - 1)
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      }
    })
  }, [])

  // 重做
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev
      
      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      }
    })
  }, [])

  // 清除存储
  const clearStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory({
      past: [],
      present: initialState,
      future: []
    })
  }, [initialState])

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z 或 Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl+Y 或 Ctrl+Shift+Z 或 Cmd+Shift+Z (Mac)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  // 保存到localStorage
  useEffect(() => {
    saveToStorage(history.present)
  }, [history.present, saveToStorage])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearStorage
  }
}
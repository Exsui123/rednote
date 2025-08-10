'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface ImageItem {
  id: string
  file: File
  url: string
  duration: number // 秒
  name: string
}

export interface TransitionType {
  id: string
  name: string
  value: string
}

export interface VideoSettings {
  resolution: '720p' | '1080p' | '4k'
  aspectRatio: '16:9' | '9:16' | '4:3' | '3:4' | '1:1'
  fps: 24 | 30 | 60
  defaultDuration: number
  globalTransition: string
  transitions: Record<string, string> // imageId1-imageId2: transitionType
}

export interface AudioSettings {
  file: File | null
  volume: number
  loop: boolean
  fadeInOut: boolean
}

export interface TextSettings {
  title: string
  font: string
  fontSize: number
  color: string
  position: 'top' | 'center' | 'bottom' | 'custom'
  positionX?: number // 百分比位置 0-100
  positionY?: number // 百分比位置 0-100
  duration: 'full' | 'custom'
  customDuration?: number
}

interface ImageToVideoContextType {
  // 图片管理
  images: ImageItem[]
  addImages: (files: File[]) => void
  removeImage: (id: string) => void
  reorderImages: (startIndex: number, endIndex: number) => void
  updateImageDuration: (id: string, duration: number) => void
  
  // 视频设置
  videoSettings: VideoSettings
  updateVideoSettings: (settings: Partial<VideoSettings>) => void
  setTransition: (fromId: string, toId: string, transition: string) => void
  
  // 音频设置
  audioSettings: AudioSettings
  updateAudioSettings: (settings: Partial<AudioSettings>) => void
  
  // 文字设置
  textSettings: TextSettings
  updateTextSettings: (settings: Partial<TextSettings>) => void
  
  // 生成状态
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  generationProgress: number
  setGenerationProgress: (progress: number | ((prev: number) => number)) => void
  generationStatus: string
  setGenerationStatus: (status: string) => void
  
  // 视频结果
  videoUrl: string | null
  setVideoUrl: (url: string | null) => void
}

const ImageToVideoContext = createContext<ImageToVideoContextType | undefined>(undefined)

export const availableTransitions: TransitionType[] = [
  { id: 'fade', name: '淡入淡出', value: 'fade' },
  { id: 'dissolve', name: '交叉溶解', value: 'dissolve' },
  { id: 'slideLeft', name: '左滑', value: 'slideLeft' },
  { id: 'slideRight', name: '右滑', value: 'slideRight' },
  { id: 'slideUp', name: '上滑', value: 'slideUp' },
  { id: 'slideDown', name: '下滑', value: 'slideDown' },
  { id: 'wipeLeft', name: '左擦除', value: 'wipeLeft' },
  { id: 'wipeRight', name: '右擦除', value: 'wipeRight' },
  { id: 'zoomIn', name: '放大', value: 'zoomIn' },
  { id: 'zoomOut', name: '缩小', value: 'zoomOut' },
  { id: 'circleOpen', name: '圆形展开', value: 'circleOpen' },
  { id: 'vertOpen', name: '垂直翻开', value: 'vertOpen' },
  { id: 'horzOpen', name: '水平翻开', value: 'horzOpen' },
  { id: 'pixelize', name: '像素化', value: 'pixelize' },
  { id: 'radial', name: '径向', value: 'radial' },
]

export function ImageToVideoProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    resolution: '1080p',
    aspectRatio: '16:9',
    fps: 30,
    defaultDuration: 3,
    globalTransition: 'fade',
    transitions: {}
  })
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    file: null,
    volume: 80,
    loop: false,
    fadeInOut: true
  })
  const [textSettings, setTextSettings] = useState<TextSettings>({
    title: '',
    font: '默认',
    fontSize: 32,
    color: '#FFFFFF',
    position: 'top',
    positionX: 50,
    positionY: 10,
    duration: 'full'
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  
  const addImages = (files: File[]) => {
    const newImages: ImageItem[] = files.map(file => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file),
      duration: videoSettings.defaultDuration,
      name: file.name
    }))
    
    setImages(prev => [...prev, ...newImages])
  }
  
  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.url)
      }
      return prev.filter(img => img.id !== id)
    })
  }
  
  const reorderImages = (startIndex: number, endIndex: number) => {
    setImages(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }
  
  const updateImageDuration = (id: string, duration: number) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, duration } : img
    ))
  }
  
  const updateVideoSettings = (settings: Partial<VideoSettings>) => {
    setVideoSettings(prev => ({ ...prev, ...settings }))
  }
  
  const setTransition = (fromId: string, toId: string, transition: string) => {
    setVideoSettings(prev => ({
      ...prev,
      transitions: {
        ...prev.transitions,
        [`${fromId}-${toId}`]: transition
      }
    }))
  }
  
  const updateAudioSettings = (settings: Partial<AudioSettings>) => {
    setAudioSettings(prev => ({ ...prev, ...settings }))
  }
  
  const updateTextSettings = (settings: Partial<TextSettings>) => {
    setTextSettings(prev => ({ ...prev, ...settings }))
  }
  
  return (
    <ImageToVideoContext.Provider value={{
      images,
      addImages,
      removeImage,
      reorderImages,
      updateImageDuration,
      videoSettings,
      updateVideoSettings,
      setTransition,
      audioSettings,
      updateAudioSettings,
      textSettings,
      updateTextSettings,
      isGenerating,
      setIsGenerating,
      generationProgress,
      setGenerationProgress,
      generationStatus,
      setGenerationStatus,
      videoUrl,
      setVideoUrl
    }}>
      {children}
    </ImageToVideoContext.Provider>
  )
}

export function useImageToVideo() {
  const context = useContext(ImageToVideoContext)
  if (!context) {
    throw new Error('useImageToVideo must be used within ImageToVideoProvider')
  }
  return context
}
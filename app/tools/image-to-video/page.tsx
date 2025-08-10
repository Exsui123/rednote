'use client'

import { ImageToVideoLayout } from '@/components/image-to-video/image-to-video-layout'

export default function ImageToVideoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📸 图片转视频工具
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            将多张图片合成为精美视频，支持转场效果、背景音乐和文字标题
          </p>
        </header>
        
        <ImageToVideoLayout />
      </div>
    </div>
  )
}
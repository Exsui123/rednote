'use client'

import { useState, useEffect } from 'react'
import { useImageToVideo } from '@/lib/contexts/image-to-video-context'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { 
  Play, 
  Download, 
  RefreshCw, 
  Film, 
  FileVideo, 
  Clock,
  HardDrive,
  Music,
  History
} from 'lucide-react'

export function GeneratePanel() {
  const { 
    images,
    videoSettings,
    audioSettings,
    textSettings,
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    generationStatus,
    setGenerationStatus,
    videoUrl,
    setVideoUrl
  } = useImageToVideo()
  
  const [history, setHistory] = useState<Array<{
    id: string
    name: string
    url: string
    timestamp: Date
  }>>([])
  
  // 计算视频信息
  const totalDuration = images.reduce((sum, img) => sum + img.duration, 0)
  const estimatedSize = Math.round(
    totalDuration * 
    (videoSettings.resolution === '4k' ? 10 : videoSettings.resolution === '1080p' ? 5 : 3) * 
    (videoSettings.fps / 30)
  )
  
  const handlePreview = async () => {
    if (images.length === 0) {
      alert('请先上传图片')
      return
    }
    
    // 预览功能将在后续实现
    console.log('预览视频')
  }
  
  const handleGenerate = async () => {
    if (images.length === 0) {
      alert('请先上传图片')
      return
    }
    
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus('准备生成视频...')
    
    try {
      // 准备表单数据
      const formData = new FormData()
      
      // 添加图片
      images.forEach((image, index) => {
        formData.append(`images`, image.file)
        formData.append(`durations`, image.duration.toString())
      })
      
      // 添加视频设置
      formData.append('settings', JSON.stringify({
        resolution: videoSettings.resolution,
        aspectRatio: videoSettings.aspectRatio,
        fps: videoSettings.fps,
        globalTransition: videoSettings.globalTransition,
        transitions: videoSettings.transitions
      }))
      
      // 添加音频
      if (audioSettings.file) {
        formData.append('audio', audioSettings.file)
        formData.append('audioSettings', JSON.stringify({
          volume: audioSettings.volume,
          loop: audioSettings.loop,
          fadeInOut: audioSettings.fadeInOut
        }))
      }
      
      // 添加文字
      if (textSettings.title) {
        formData.append('textSettings', JSON.stringify(textSettings))
      }
      
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 1000)
      
      // 发送请求到后端API
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      
      if (!response.ok) {
        throw new Error('视频生成失败')
      }
      
      const data = await response.json()
      
      setGenerationProgress(100)
      setGenerationStatus('视频生成完成！')
      setVideoUrl(data.url)
      
      // 添加到历史记录
      setHistory(prev => [{
        id: Date.now().toString(),
        name: `视频_${new Date().toLocaleTimeString()}.mp4`,
        url: data.url,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])
      
    } catch (error) {
      console.error('生成视频失败:', error)
      setGenerationStatus('生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = `video_${Date.now()}.mp4`
      a.click()
    }
  }
  
  return (
    <div className="space-y-6">
      {/* 项目状态 */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Film className="w-5 h-5" />
          项目状态
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              总时长
            </span>
            <span className="font-medium">{totalDuration.toFixed(1)} 秒</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <FileVideo className="w-4 h-4" />
              图片数量
            </span>
            <span className="font-medium">{images.length} 张</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <HardDrive className="w-4 h-4" />
              预估大小
            </span>
            <span className="font-medium">~{estimatedSize} MB</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Music className="w-4 h-4" />
              音频轨道
            </span>
            <span className="font-medium">
              {audioSettings.file ? '✅ 已添加' : '❌ 未添加'}
            </span>
          </div>
        </div>
      </Card>
      
      {/* 操作按钮 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">🚀 操作按钮</h3>
        
        <Button 
          className="w-full" 
          variant="outline"
          onClick={handlePreview}
          disabled={isGenerating || images.length === 0}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重新预览
        </Button>
        
        <Button 
          className="w-full" 
          onClick={handleGenerate}
          disabled={isGenerating || images.length === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          {isGenerating ? '生成中...' : '开始生成视频'}
        </Button>
        
        <Button 
          className="w-full" 
          variant="secondary"
          onClick={handleDownload}
          disabled={!videoUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          下载最新视频
        </Button>
      </div>
      
      {/* 生成进度 */}
      {isGenerating && (
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">⏳ 生成进度</h4>
          <Progress value={generationProgress} className="mb-2" />
          <p className="text-xs text-gray-500">{generationStatus}</p>
          <p className="text-xs text-gray-400 mt-1">
            预计剩余: {Math.round((100 - generationProgress) * 0.5)}秒
          </p>
        </Card>
      )}
      
      {/* 历史记录 */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            历史记录
          </h3>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {history.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.timestamp.toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVideoUrl(item.url)
                    handleDownload()
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useEffect, useRef, useState } from 'react'
import { useImageToVideo } from '@/lib/contexts/image-to-video-context'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Settings,
  Maximize
} from 'lucide-react'

export function VideoPreview() {
  const { images, videoUrl, videoSettings, textSettings, updateTextSettings } = useImageToVideo()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDraggingText, setIsDraggingText] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  
  // 计算总时长
  const totalDuration = images.reduce((sum, img) => sum + img.duration, 0)
  
  // 获取画布尺寸
  const getCanvasSize = () => {
    const baseSize = videoSettings.resolution === '720p' ? 720 : 
                    videoSettings.resolution === '1080p' ? 1080 : 2160
    
    let width, height
    switch (videoSettings.aspectRatio) {
      case '16:9':
        width = Math.round(baseSize * 16 / 9)
        height = baseSize
        break
      case '9:16':
        width = baseSize
        height = Math.round(baseSize * 16 / 9)
        break
      case '4:3':
        width = Math.round(baseSize * 4 / 3)
        height = baseSize
        break
      case '3:4':
        width = baseSize
        height = Math.round(baseSize * 4 / 3)
        break
      case '1:1':
        width = baseSize
        height = baseSize
        break
      default:
        width = Math.round(baseSize * 16 / 9)
        height = baseSize
    }
    
    return { width, height }
  }
  
  const { width, height } = getCanvasSize()
  
  // 播放控制
  const togglePlayPause = () => {
    if (videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    } else {
      // 图片预览模式
      setIsPlaying(!isPlaying)
    }
  }
  
  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
    } else {
      setCurrentTime(Math.max(0, currentTime - 10))
    }
  }
  
  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
    } else {
      setCurrentTime(Math.min(totalDuration, currentTime + 10))
    }
  }
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100
    }
  }
  
  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }
  
  const handleFullscreen = () => {
    const container = document.querySelector('.video-preview-container')
    if (container && container.requestFullscreen) {
      container.requestFullscreen()
    }
  }
  
  // 图片预览动画
  useEffect(() => {
    if (!videoUrl && images.length > 0 && isPlaying) {
      const animate = () => {
        setCurrentTime(prev => {
          const newTime = prev + 0.033 // 约30fps
          
          if (newTime >= totalDuration) {
            setIsPlaying(false)
            return 0
          }
          
          // 计算当前应该显示的图片
          let accumulatedTime = 0
          for (let i = 0; i < images.length; i++) {
            accumulatedTime += images[i].duration
            if (newTime < accumulatedTime) {
              setCurrentImageIndex(i)
              break
            }
          }
          
          return newTime
        })
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, images, totalDuration, videoUrl])
  
  // 处理文字拖动
  const handleTextMouseDown = (e: React.MouseEvent) => {
    if (!textSettings.title || videoUrl) return
    setIsDraggingText(true)
    e.preventDefault()
  }
  
  const handleTextMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingText || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    updateTextSettings({
      position: 'custom',
      positionX: Math.max(0, Math.min(100, x)),
      positionY: Math.max(0, Math.min(100, y))
    })
  }
  
  const handleTextMouseUp = () => {
    setIsDraggingText(false)
  }
  
  // 绘制文字到canvas
  useEffect(() => {
    if (canvasRef.current && images[currentImageIndex] && !videoUrl) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const img = new Image()
      img.onload = () => {
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // 绘制文字
        if (textSettings.title) {
          ctx.font = `${textSettings.fontSize}px sans-serif`
          ctx.fillStyle = textSettings.color
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          let x = canvas.width / 2
          let y = 50
          
          if (textSettings.position === 'custom' && textSettings.positionX !== undefined && textSettings.positionY !== undefined) {
            x = (canvas.width * textSettings.positionX) / 100
            y = (canvas.height * textSettings.positionY) / 100
          } else if (textSettings.position === 'center') {
            y = canvas.height / 2
          } else if (textSettings.position === 'bottom') {
            y = canvas.height - 50
          }
          
          ctx.fillText(textSettings.title, x, y)
        }
      }
      img.src = images[currentImageIndex].url
    }
  }, [currentImageIndex, images, textSettings, videoUrl])
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="video-preview-container h-full flex flex-col">
      {/* 视频显示区域 */}
      <div className="flex-1 bg-black flex items-center justify-center relative">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => setIsPlaying(false)}
          />
        ) : images.length > 0 ? (
          <div 
            ref={containerRef}
            className="relative"
            onMouseMove={handleTextMouseMove}
            onMouseUp={handleTextMouseUp}
            onMouseLeave={handleTextMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="max-w-full max-h-full"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            />
            {/* 文字拖动热区 */}
            {textSettings.title && !videoUrl && (
              <div
                className={`absolute ${isDraggingText ? 'cursor-move' : 'cursor-grab'} 
                  px-4 py-2 bg-black/20 rounded hover:bg-black/30 transition-colors`}
                style={{
                  left: `${textSettings.positionX || 50}%`,
                  top: `${textSettings.positionY || 10}%`,
                  transform: 'translate(-50%, -50%)',
                  userSelect: 'none'
                }}
                onMouseDown={handleTextMouseDown}
              >
                <span style={{ 
                  color: textSettings.color,
                  fontSize: `${textSettings.fontSize * 0.5}px`
                }}>
                  {textSettings.title}
                </span>
              </div>
            )}
            {!isPlaying && images.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={togglePlayPause}
                  className="rounded-full p-4 pointer-events-auto"
                >
                  <Play className="w-8 h-8" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <p className="text-xl mb-2">视频预览播放器</p>
            <p className="text-sm">{width} x {height}</p>
            <p className="text-xs mt-4">请上传图片开始创作</p>
          </div>
        )}
      </div>
      
      {/* 播放控制栏 */}
      <div className="p-4 bg-gray-100 dark:bg-gray-900">
        {/* 进度条 */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={videoUrl ? duration : totalDuration}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(videoUrl ? duration : totalDuration)}</span>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkipBack}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkipForward}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              className="w-24"
            />
            
            <Button
              size="sm"
              variant="ghost"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFullscreen}
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
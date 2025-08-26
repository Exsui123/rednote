"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Eye, EyeOff, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { SimplePreview } from './simple-preview'
import type { WatermarkConfig, DocumentFile } from '@/lib/types/watermark'

interface WatermarkPreviewProps {
  files: DocumentFile[]
  config: WatermarkConfig
  selectedFileIndex?: number
  onFileChange?: (index: number) => void
}

export function WatermarkPreview({ 
  files, 
  config, 
  selectedFileIndex = 0,
  onFileChange 
}: WatermarkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState([100])
  const [showWatermark, setShowWatermark] = useState(true)
  const [previewData, setPreviewData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const currentFile = files[selectedFileIndex]

  // 生成预览数据
  const generatePreview = useCallback(async () => {
    if (!currentFile) return

    setIsLoading(true)
    try {
      if (currentFile.type === 'pdf') {
        await generatePdfPreview()
      } else if (currentFile.type === 'word') {
        await generateWordPreview()
      }
    } catch (error) {
      console.error('预览生成失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentFile])

  // PDF预览生成
  const generatePdfPreview = async () => {
    if (!currentFile) return
    
    const fileUrl = URL.createObjectURL(currentFile.file)
    setPreviewData(fileUrl)
  }

  // Word预览生成
  const generateWordPreview = async () => {
    if (!currentFile) return

    // 简单的Word预览，显示文件信息
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小 (A4比例，适配预览尺寸)
    canvas.width = 400
    canvas.height = 565

    // 白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制Word文档标题
    ctx.fillStyle = '#2563eb'
    ctx.font = 'bold 18px Arial'
    ctx.fillText('Word 文档预览', 50, 50)
    
    ctx.fillStyle = '#374151'
    ctx.font = '12px Arial'
    ctx.fillText(`文件: ${currentFile.name}`, 50, 80)
    ctx.fillText(`大小: ${formatFileSize(currentFile.size)}`, 50, 100)
    
    // 模拟文档标题
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('文档标题', 50, 140)
    
    // 模拟段落内容
    ctx.fillStyle = '#4b5563'
    ctx.font = '14px Arial'
    const paragraphs = [
      '这是一个Word文档的示例内容。在实际处理时，',
      '文档会被转换为PDF格式，然后添加水印。',
      '',
      '水印将会按照您的配置进行添加：',
      '• 透明度、颜色、角度等都会保持一致',
      '• 支持多种水印模式和位置',
      '• 确保水印难以被删除',
      '',
      '处理完成后，您将获得一个带水印的PDF文件。'
    ]
    
    paragraphs.forEach((line, index) => {
      const y = 170 + index * 22
      if (y < canvas.height - 100) {
        ctx.fillText(line, 50, y)
      }
    })
    
    // 添加底部提示
    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px Arial'
    ctx.fillText('* 实际转换会保留原始格式和内容', 50, canvas.height - 30)
  }

  // 绘制水印预览
  const drawWatermarkPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !showWatermark) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清除之前的水印
    if (currentFile?.type === 'word') {
      generateWordPreview()
    }

    const { width, height } = canvas
    
    // 设置水印样式
    ctx.save()
    ctx.font = `${config.fontSize}px Arial`
    ctx.fillStyle = config.color
    ctx.globalAlpha = config.opacity

    // 根据模式绘制水印
    switch (config.pattern) {
      case 'single':
        drawSingleWatermark(ctx, width, height)
        break
      case 'repeat':
      case 'grid':
        drawGridWatermark(ctx, width, height)
        break
      case 'diagonal':
        drawDiagonalWatermark(ctx, width, height)
        break
      case 'paranoid':
        drawParanoidWatermark(ctx, width, height)
        break
      case 'anti-removal':
        drawAntiRemovalWatermark(ctx, width, height)
        break
    }

    ctx.restore()
  }, [config, showWatermark, currentFile])

  // 单个水印
  const drawSingleWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const { x, y } = getWatermarkPosition(width, height)
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((config.rotation * Math.PI) / 180)
    
    // 居中对齐
    const textWidth = ctx.measureText(config.text).width
    ctx.fillText(config.text, -textWidth/2, 0)
    ctx.restore()
  }

  // 网格水印
  const drawGridWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const textWidth = ctx.measureText(config.text).width
    const textHeight = config.fontSize
    const spacing = Math.max(config.spacing * 0.5, 50) // 适配预览尺寸，减少间距

    for (let x = textWidth / 2; x < width; x += textWidth + spacing) {
      for (let y = textHeight; y < height; y += textHeight + spacing) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate((config.rotation * Math.PI) / 180)
        ctx.fillText(config.text, -textWidth/2, 0)
        ctx.restore()
      }
    }
  }

  // 对角线水印
  const drawDiagonalWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const textWidth = ctx.measureText(config.text).width
    const spacing = Math.max(config.spacing * 0.4, 60) // 适配预览尺寸
    
    // 绘制多个对角线
    const step = spacing + textWidth
    
    // 从左上到右下的对角线
    for (let offset = -height; offset < width; offset += step) {
      for (let y = 0; y < height; y += step * 0.7) {
        const x = offset + y
        if (x > -textWidth && x < width + textWidth && y > 0 && y < height) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(((config.rotation + 45) * Math.PI) / 180)
          ctx.fillText(config.text, -textWidth/2, 0)
          ctx.restore()
        }
      }
    }
  }

  // 偏执狂模式 - 简化预览版本
  const drawParanoidWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const textWidth = ctx.measureText(config.text).width
    const baseSpacing = Math.max(config.spacing * 0.3, 40) // 适配预览尺寸
    
    // 创建简化版随机种子（基于文本长度）
    let seed = config.text.length * 1000
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    // 第1层：随机化网格（主要层）
    ctx.globalAlpha = config.opacity * 0.8
    for (let x = 0; x < width; x += baseSpacing) {
      for (let y = 0; y < height; y += baseSpacing) {
        const offsetX = (pseudoRandom() - 0.5) * baseSpacing * 0.6
        const offsetY = (pseudoRandom() - 0.5) * baseSpacing * 0.6
        
        const finalX = x + offsetX
        const finalY = y + offsetY
        
        if (finalX > 0 && finalX < width && finalY > 0 && finalY < height) {
          ctx.save()
          ctx.translate(finalX, finalY)
          
          // 随机大小和角度变化
          const sizeVariation = 0.8 + pseudoRandom() * 0.4
          const angleVariation = config.rotation + (pseudoRandom() - 0.5) * 60
          
          ctx.scale(sizeVariation, sizeVariation)
          ctx.rotate((angleVariation * Math.PI) / 180)
          
          // 随机文本变体
          const variants = [config.text, config.text.toUpperCase(), config.text + '•']
          const variant = variants[Math.floor(pseudoRandom() * variants.length)]
          
          ctx.fillText(variant, -textWidth/2, 0)
          ctx.restore()
        }
      }
    }
    
    // 第2层：噪声水印（降低密度适配预览）
    ctx.globalAlpha = config.opacity * 0.3
    const noiseCount = Math.floor((width * height) / 5000) // 减少预览中的噪声数量
    for (let i = 0; i < noiseCount; i++) {
      const x = pseudoRandom() * width
      const y = pseudoRandom() * height
      
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(pseudoRandom() * 2 * Math.PI) // 完全随机角度
      ctx.scale(0.5 + pseudoRandom() * 0.5, 0.5 + pseudoRandom() * 0.5)
      
      // 使用小符号作为噪声
      const noiseSymbols = ['©', '®', '•', '°']
      const symbol = noiseSymbols[Math.floor(pseudoRandom() * noiseSymbols.length)]
      ctx.fillText(symbol, 0, 0)
      ctx.restore()
    }
    
    // 第3层：边界混淆（简化版）
    ctx.globalAlpha = config.opacity * 0.2
    const margin = 20
    const step = baseSpacing
    
    // 顶部和底部
    for (let x = margin; x < width - margin; x += step) {
      const topY = margin + pseudoRandom() * 10
      const bottomY = height - margin + pseudoRandom() * 10
      
      ctx.save()
      ctx.translate(x, topY)
      ctx.rotate(pseudoRandom() * 2 * Math.PI)
      ctx.scale(0.7, 0.7)
      ctx.fillText('•', 0, 0)
      ctx.restore()
      
      ctx.save()
      ctx.translate(x, bottomY)
      ctx.rotate(pseudoRandom() * 2 * Math.PI)
      ctx.scale(0.7, 0.7)
      ctx.fillText('•', 0, 0)
      ctx.restore()
    }
  }

  // 反去水印模式预览
  const drawAntiRemovalWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const textWidth = ctx.measureText(config.text).width
    const baseSpacing = Math.max(config.spacing * 0.2, 40)
    
    // 简化版随机种子
    let seed = config.text.length * 7777
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    // 第1层：Word风格水印 (浅灰色，-45度，规律排列)
    ctx.globalAlpha = config.opacity * 0.4
    ctx.fillStyle = '#CCCCCC'
    
    const wordSpacing = Math.max(config.fontSize * 1.8, 60)
    for (let x = wordSpacing; x < width - wordSpacing; x += wordSpacing) {
      for (let y = wordSpacing; y < height - wordSpacing; y += wordSpacing) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(-45 * Math.PI / 180)
        ctx.fillText(config.text, -textWidth/2, 0)
        ctx.restore()
      }
    }
    
    // 第2层：自定义随机化水印
    ctx.fillStyle = config.color
    ctx.globalAlpha = config.opacity * 0.6
    for (let x = 30; x < width - 30; x += baseSpacing) {
      for (let y = 50; y < height - 50; y += baseSpacing) {
        const offsetX = (pseudoRandom() - 0.5) * baseSpacing * 0.5
        const offsetY = (pseudoRandom() - 0.5) * baseSpacing * 0.5
        
        const finalX = x + offsetX
        const finalY = y + offsetY
        
        if (finalX > 20 && finalX < width - 20 && finalY > 40 && finalY < height - 40) {
          ctx.save()
          ctx.translate(finalX, finalY)
          
          const sizeVar = 0.8 + pseudoRandom() * 0.4
          const angleVar = config.rotation + (pseudoRandom() - 0.5) * 40
          
          ctx.scale(sizeVar, sizeVar)
          ctx.rotate((angleVar * Math.PI) / 180)
          
          const variants = [config.text, config.text.toUpperCase()]
          const variant = variants[Math.floor(pseudoRandom() * variants.length)]
          
          ctx.fillText(variant, -textWidth/2, 0)
          ctx.restore()
        }
      }
    }
    
    // 第3层：微弱的对抗特征
    ctx.globalAlpha = config.opacity * 0.15
    const features = ['·', '•', '°']
    for (let i = 0; i < features.length; i++) {
      const feature = features[i]
      for (let x = 25; x < width - 25; x += 45) {
        for (let y = 25; y < height - 25; y += 45) {
          const jitterX = (pseudoRandom() - 0.5) * 20
          const jitterY = (pseudoRandom() - 0.5) * 20
          
          ctx.save()
          ctx.translate(x + jitterX, y + jitterY)
          ctx.rotate(pseudoRandom() * Math.PI)
          ctx.scale(0.6, 0.6)
          ctx.fillText(feature, 0, 0)
          ctx.restore()
        }
      }
    }
  }

  // 获取水印位置
  const getWatermarkPosition = (width: number, height: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const margin = 30 // 适配预览尺寸的边距

    switch (config.position) {
      case 'center': return { x: centerX, y: centerY }
      case 'top-left': return { x: margin, y: margin + config.fontSize }
      case 'top-center': return { x: centerX, y: margin + config.fontSize }
      case 'top-right': return { x: width - margin, y: margin + config.fontSize }
      case 'middle-left': return { x: margin, y: centerY }
      case 'middle-right': return { x: width - margin, y: centerY }
      case 'bottom-left': return { x: margin, y: height - margin }
      case 'bottom-center': return { x: centerX, y: height - margin }
      case 'bottom-right': return { x: width - margin, y: height - margin }
      default: return { x: centerX, y: centerY }
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 监听配置变化重绘水印
  useEffect(() => {
    drawWatermarkPreview()
  }, [config, showWatermark, drawWatermarkPreview])

  // 客户端挂载检测
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 初始化预览
  useEffect(() => {
    if (isMounted) {
      generatePreview()
    }
  }, [generatePreview, isMounted])

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            水印预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">预览水印效果</p>
            </div>
            
            {/* 水印效果预览 */}
            <SimplePreview 
              config={showWatermark ? config : { ...config, opacity: 0 }}
              width={400}
              height={565}
            />
            
            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={showWatermark ? "default" : "outline"}
                size="sm"
                onClick={() => setShowWatermark(!showWatermark)}
              >
                {showWatermark ? (
                  <>
                    <EyeOff className="mr-1 h-4 w-4" />
                    隐藏水印
                  </>
                ) : (
                  <>
                    <Eye className="mr-1 h-4 w-4" />
                    显示水印
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-center text-gray-500 space-y-1">
              <p>上传文档后可预览实际水印在文档中的效果</p>
              
              {config.pattern === 'paranoid' && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-red-700 font-medium">
                    🔒 当前使用&ldquo;偏执狂模式&rdquo;- 企业级防护！
                  </p>
                  <p className="text-red-600 mt-1">
                    四层随机化防护，即使专业用户也难以完全去除
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            水印预览
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWatermark(!showWatermark)}
            >
              {showWatermark ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  隐藏水印
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  显示水印
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文件选择器 */}
        {files.length > 1 && (
          <div className="flex gap-2 p-2 bg-gray-50 rounded-lg overflow-x-auto">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => onFileChange?.(index)}
                className={`px-3 py-2 text-sm rounded whitespace-nowrap ${
                  index === selectedFileIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {file.name.length > 15 
                  ? `${file.name.substring(0, 15)}...`
                  : file.name
                }
              </button>
            ))}
          </div>
        )}

        {/* 预览区域 */}
        <div className="relative bg-gray-50 rounded-lg p-4">
          {isMounted ? (
            <div>
              {/* 文件类型提示 */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {currentFile?.type === 'pdf' ? '📄 PDF文档' : '📝 Word文档'}
                  <span className="text-blue-600">•</span>
                  <span className="font-medium">{currentFile?.name}</span>
                </div>
              </div>

              {/* 统一预览 */}
              <SimplePreview 
                config={showWatermark ? config : { ...config, opacity: 0 }}
                width={400}
                height={565}
              />

              {/* PDF特殊处理：显示实际内容 */}
              {currentFile?.type === 'pdf' && previewData && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">PDF实际内容预览</h4>
                  <iframe
                    src={`${previewData}#toolbar=0&navpanes=0&scrollbar=0&view=FitW`}
                    width="100%"
                    height="300"
                    className="border rounded"
                    title="PDF内容"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[565px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">初始化预览中...</p>
              </div>
            </div>
          )}
        </div>

        {/* 控制栏 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom([Math.max(50, zoom[0] - 25)])}
                disabled={zoom[0] <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {zoom[0]}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom([Math.min(200, zoom[0] + 25)])}
                disabled={zoom[0] >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 max-w-[200px] truncate">
            {currentFile?.name} • {currentFile && formatFileSize(currentFile.size)}
          </div>
        </div>

        {/* 预览说明 */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <Eye className="h-3 w-3" />
            预览说明
          </h4>
          <ul className="space-y-1 text-blue-700">
            <li>• <strong>PDF文档</strong>：显示真实内容 + 实时水印效果</li>
            <li>• <strong>Word文档</strong>：显示内容预览 + 水印效果演示</li>
            <li>• <strong>水印效果</strong>：与实际生成高度一致</li>
            <li>• <strong>建议</strong>：调整到满意效果后再批量处理</li>
          </ul>
          
          {config.pattern === 'diagonal' && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-blue-600 text-xs font-medium">
                💡 当前使用&ldquo;对角线水印&rdquo;模式，删除难度最高
              </p>
            </div>
          )}
          
          {config.pattern === 'paranoid' && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <p className="text-red-700 text-xs font-medium">
                🔒 当前使用&ldquo;偏执狂模式&rdquo;- 企业级防护！
              </p>
              <p className="text-red-600 text-xs mt-1">
                四层随机化防护，即使专业用户也难以完全去除
              </p>
            </div>
          )}
          
          {config.pattern === 'anti-removal' && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-blue-700 text-xs font-medium">
                🛡️ 当前使用&ldquo;反去水印模式&rdquo;- 对抗算法！
              </p>
              <p className="text-blue-600 text-xs mt-1">
                混合多种水印特征，让去水印工具无法完全成功
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
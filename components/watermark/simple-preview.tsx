"use client"

import { useEffect, useRef } from 'react'
import type { WatermarkConfig } from '@/lib/types/watermark'

interface SimplePreviewProps {
  config: WatermarkConfig
  width?: number
  height?: number
}

export function SimplePreview({ 
  config, 
  width = 400, 
  height = 565 
}: SimplePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    drawPreview()
  }, [config, width, height])

  const drawPreview = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 绘制文档背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // 绘制文档边框
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)

    // 绘制模拟内容线条
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    for (let i = 50; i < height - 50; i += 25) {
      ctx.beginPath()
      ctx.moveTo(30, i)
      ctx.lineTo(width - 30, i)
      ctx.stroke()
    }

    // 绘制标题区域
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('文档内容预览', 30, 35)

    // 绘制水印
    drawWatermark(ctx)
  }

  const drawWatermark = (ctx: CanvasRenderingContext2D) => {
    ctx.save()
    
    // 设置水印样式
    ctx.font = `${Math.max(config.fontSize * 0.8, 12)}px Arial`
    ctx.fillStyle = config.color
    ctx.globalAlpha = config.opacity

    // 根据模式绘制水印
    switch (config.pattern) {
      case 'single':
        drawSingleWatermark(ctx)
        break
      case 'repeat':
      case 'grid':
        drawGridWatermark(ctx)
        break
      case 'diagonal':
        drawDiagonalWatermark(ctx)
        break
      case 'paranoid':
        drawParanoidWatermark(ctx)
        break
      case 'anti-removal':
        drawAntiRemovalWatermark(ctx)
        break
    }

    ctx.restore()
  }

  const drawSingleWatermark = (ctx: CanvasRenderingContext2D) => {
    const { x, y } = getWatermarkPosition()
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((config.rotation * Math.PI) / 180)
    
    const textWidth = ctx.measureText(config.text).width
    ctx.fillText(config.text, -textWidth/2, 0)
    ctx.restore()
  }

  const drawGridWatermark = (ctx: CanvasRenderingContext2D) => {
    const textWidth = ctx.measureText(config.text).width
    const textHeight = Math.max(config.fontSize * 0.8, 12)
    const spacing = Math.max(config.spacing * 0.6, 60)

    for (let x = textWidth / 2 + 30; x < width - 30; x += textWidth + spacing) {
      for (let y = textHeight + 30; y < height - 30; y += textHeight + spacing) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate((config.rotation * Math.PI) / 180)
        ctx.fillText(config.text, -textWidth/2, 0)
        ctx.restore()
      }
    }
  }

  const drawDiagonalWatermark = (ctx: CanvasRenderingContext2D) => {
    const textWidth = ctx.measureText(config.text).width
    const spacing = Math.max(config.spacing * 0.5, 80)
    const step = spacing + textWidth * 0.8
    
    // 绘制多条对角线
    for (let offset = -height; offset < width + height; offset += step) {
      for (let y = 40; y < height - 40; y += step * 0.7) {
        const x = offset + y * 0.8
        if (x > -textWidth && x < width + textWidth && y > 20 && y < height - 20) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(((config.rotation + 45) * Math.PI) / 180)
          ctx.fillText(config.text, -textWidth/2, 0)
          ctx.restore()
        }
      }
    }
  }

  const drawParanoidWatermark = (ctx: CanvasRenderingContext2D) => {
    const textWidth = ctx.measureText(config.text).width
    const baseSpacing = Math.max(config.spacing * 0.4, 50)
    
    // 创建伪随机数生成器
    let seed = config.text.length * 1337
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    // 第1层：随机化网格
    ctx.globalAlpha = config.opacity * 0.8
    for (let x = 30; x < width - 30; x += baseSpacing) {
      for (let y = 50; y < height - 50; y += baseSpacing) {
        const offsetX = (pseudoRandom() - 0.5) * baseSpacing * 0.6
        const offsetY = (pseudoRandom() - 0.5) * baseSpacing * 0.6
        
        const finalX = x + offsetX
        const finalY = y + offsetY
        
        if (finalX > 20 && finalX < width - 20 && finalY > 40 && finalY < height - 40) {
          ctx.save()
          ctx.translate(finalX, finalY)
          
          // 随机变化
          const sizeVar = 0.7 + pseudoRandom() * 0.6
          const angleVar = config.rotation + (pseudoRandom() - 0.5) * 60
          
          ctx.scale(sizeVar, sizeVar)
          ctx.rotate((angleVar * Math.PI) / 180)
          
          // 文本变体
          const variants = [config.text, config.text.toUpperCase(), config.text + '•']
          const variant = variants[Math.floor(pseudoRandom() * variants.length)]
          
          ctx.fillText(variant, -textWidth/2, 0)
          ctx.restore()
        }
      }
    }
    
    // 第2层：噪声水印
    ctx.globalAlpha = config.opacity * 0.3
    const noiseCount = Math.floor((width * height) / 8000)
    for (let i = 0; i < noiseCount; i++) {
      const x = 30 + pseudoRandom() * (width - 60)
      const y = 50 + pseudoRandom() * (height - 100)
      
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(pseudoRandom() * 2 * Math.PI)
      ctx.scale(0.4 + pseudoRandom() * 0.4, 0.4 + pseudoRandom() * 0.4)
      
      const symbols = ['©', '®', '•', '°', '™']
      const symbol = symbols[Math.floor(pseudoRandom() * symbols.length)]
      ctx.fillText(symbol, 0, 0)
      ctx.restore()
    }
    
    // 第3层：边界装饰
    ctx.globalAlpha = config.opacity * 0.2
    const margin = 25
    const step = baseSpacing * 0.8
    
    // 顶部和底部
    for (let x = margin; x < width - margin; x += step) {
      [margin + 10, height - margin - 10].forEach(y => {
        ctx.save()
        ctx.translate(x + pseudoRandom() * 10, y + pseudoRandom() * 5)
        ctx.rotate(pseudoRandom() * Math.PI)
        ctx.scale(0.6, 0.6)
        ctx.fillText('•', 0, 0)
        ctx.restore()
      })
    }
  }

  const drawAntiRemovalWatermark = (ctx: CanvasRenderingContext2D) => {
    const textWidth = ctx.measureText(config.text).width
    const baseSpacing = Math.max(config.spacing * 0.4, 50)
    
    // 创建伪随机数生成器
    let seed = config.text.length * 9999
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    
    // 策略1: 模拟Word风格水印
    ctx.globalAlpha = config.opacity * 0.6 // 稍微降低以便叠加
    ctx.fillStyle = '#CCCCCC' // Word典型颜色
    
    const wordSpacing = Math.max(config.fontSize * 2.5, 80)
    for (let x = wordSpacing; x < width - wordSpacing; x += wordSpacing) {
      for (let y = wordSpacing; y < height - wordSpacing; y += wordSpacing) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(-45 * Math.PI / 180) // Word典型角度
        ctx.fillText(config.text, -textWidth/2, 0)
        ctx.restore()
      }
    }
    
    // 策略2: 随机化网格
    ctx.fillStyle = config.color
    ctx.globalAlpha = config.opacity * 0.5
    for (let x = 30; x < width - 30; x += baseSpacing) {
      for (let y = 50; y < height - 50; y += baseSpacing) {
        const offsetX = (pseudoRandom() - 0.5) * baseSpacing * 0.6
        const offsetY = (pseudoRandom() - 0.5) * baseSpacing * 0.6
        
        const finalX = x + offsetX
        const finalY = y + offsetY
        
        if (finalX > 20 && finalX < width - 20 && finalY > 40 && finalY < height - 40) {
          ctx.save()
          ctx.translate(finalX, finalY)
          
          const sizeVar = 0.7 + pseudoRandom() * 0.6
          const angleVar = config.rotation + (pseudoRandom() - 0.5) * 60
          
          ctx.scale(sizeVar, sizeVar)
          ctx.rotate((angleVar * Math.PI) / 180)
          
          // 文本变体
          const variants = [config.text, config.text.toUpperCase(), config.text + '•']
          const variant = variants[Math.floor(pseudoRandom() * variants.length)]
          
          ctx.fillText(variant, -textWidth/2, 0)
          ctx.restore()
        }
      }
    }
    
    // 策略3: 频域标记 (简化预览版)
    ctx.globalAlpha = config.opacity * 0.15
    const frequencies = [
      { scale: 0.15, opacity: 0.3 },
      { scale: 0.4, opacity: 0.2 }
    ]
    
    frequencies.forEach(freq => {
      const scaledSpacing = baseSpacing * freq.scale
      for (let x = 0; x < width; x += scaledSpacing) {
        for (let y = 0; y < height; y += scaledSpacing) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate((config.rotation + Math.sin(x + y) * 15) * Math.PI / 180)
          ctx.globalAlpha = config.opacity * freq.opacity
          ctx.fillText('·', 0, 0)
          ctx.restore()
        }
      }
    })
    
    // 策略4: 对抗特征层
    ctx.globalAlpha = config.opacity * 0.1
    const fakeFeatures = ['.', '|', '/']
    fakeFeatures.forEach((feature, index) => {
      for (let x = 20; x < width - 20; x += 35) {
        for (let y = 20; y < height - 20; y += 35) {
          const jitterX = (pseudoRandom() - 0.5) * 15
          const jitterY = (pseudoRandom() - 0.5) * 15
          
          ctx.save()
          ctx.translate(x + jitterX, y + jitterY)
          ctx.rotate((index * 45 + pseudoRandom() * 30) * Math.PI / 180)
          ctx.scale(0.8, 0.8)
          ctx.fillText(feature, 0, 0)
          ctx.restore()
        }
      }
    })
  }

  const getWatermarkPosition = () => {
    const centerX = width / 2
    const centerY = height / 2
    const margin = 40

    switch (config.position) {
      case 'center': return { x: centerX, y: centerY }
      case 'top-left': return { x: margin, y: margin + 20 }
      case 'top-center': return { x: centerX, y: margin + 20 }
      case 'top-right': return { x: width - margin, y: margin + 20 }
      case 'middle-left': return { x: margin, y: centerY }
      case 'middle-right': return { x: width - margin, y: centerY }
      case 'bottom-left': return { x: margin, y: height - margin }
      case 'bottom-center': return { x: centerX, y: height - margin }
      case 'bottom-right': return { x: width - margin, y: height - margin }
      default: return { x: centerX, y: centerY }
    }
  }

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded-lg shadow-lg bg-white max-w-full h-auto"
        style={{
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  )
}
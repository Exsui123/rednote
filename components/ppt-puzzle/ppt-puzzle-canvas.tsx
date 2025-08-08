"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { PptPuzzleState } from "@/lib/types/ppt-puzzle"
import { generatePuzzleLayout } from "@/lib/utils/puzzle-layout"
import { PuzzleImageItem, PuzzleLayoutConfig } from "@/lib/types/ppt-puzzle"

// 图片分配函数 - 按照新规则分配
function distributeImages(
  mainImages: PuzzleImageItem[],
  subImages: PuzzleImageItem[],
  layoutConfig: PuzzleLayoutConfig,
  layout: string,
  subPerMain: number
) {
  const mainRegionsCount = layoutConfig.mainRegions.length
  const subRegionsCount = layoutConfig.subRegions.length

  console.log('Distribution info:', {
    mainRegionsCount,
    subRegionsCount,
    availableMainImages: mainImages.length,
    availableSubImages: subImages.length,
    subPerMain,
    layout
  })

  const distributedMainImages: (PuzzleImageItem | undefined)[] = []
  const distributedSubImages: (PuzzleImageItem | undefined)[] = []
  
  // 分配主图到对应位置
  for (let i = 0; i < mainRegionsCount; i++) {
    distributedMainImages[i] = mainImages[i] || undefined
  }
  
  // 按照新规则分配次图：每个主图配subPerMain个次图
  let subImageIndex = 0
  for (let mainIndex = 0; mainIndex < mainRegionsCount; mainIndex++) {
    // 计算这个主图应该有多少个次图
    const subsForThisMain = Math.min(subPerMain, subImages.length - subImageIndex)
    
    // 分配次图给当前主图
    for (let i = 0; i < subsForThisMain; i++) {
      // 计算次图在subRegions中的位置
      const regionIndex = mainIndex * subPerMain + i
      if (regionIndex < subRegionsCount && subImageIndex < subImages.length) {
        distributedSubImages[regionIndex] = subImages[subImageIndex]
        subImageIndex++
      }
    }
  }
  
  // 填充剩余空位
  while (distributedSubImages.length < subRegionsCount) {
    distributedSubImages.push(undefined)
  }
  
  console.log('Distribution result:', {
    distributedMainImages: distributedMainImages.map(img => img?.name || 'empty'),
    distributedSubImages: distributedSubImages.map(img => img?.name || 'empty')
  })
  
  return { distributedMainImages, distributedSubImages }
}

interface PptPuzzleCanvasProps {
  puzzleState: PptPuzzleState
  onStateChange: (state: PptPuzzleState) => void
}

export function PptPuzzleCanvas({ puzzleState, onStateChange }: PptPuzzleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({})

  // 加载所有图片
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = puzzleState.images.map(async (imageItem) => {
        return new Promise<[string, HTMLImageElement | null]>((resolve) => {
          const img = new Image()
          img.onload = () => resolve([imageItem.url, img])
          img.onerror = () => {
            console.error(`Failed to load image: ${imageItem.name}`)
            resolve([imageItem.url, null])
          }
          img.src = imageItem.url
        })
      })

      const results = await Promise.all(imagePromises)
      const imageMap: Record<string, HTMLImageElement> = {}
      
      results.forEach(([url, img]) => {
        if (img) {
          imageMap[url] = img
        }
      })

      setLoadedImages(imageMap)
    }

    if (puzzleState.images.length > 0) {
      loadImages()
    }
  }, [puzzleState.images])

  // 绘制画布内容
  useEffect(() => {
    const drawCanvas = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制背景色
      ctx.fillStyle = puzzleState.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 只有设置了showPuzzle才绘制拼图
      if (!puzzleState.showPuzzle) {
        // 绘制提示信息
        ctx.fillStyle = '#64748b'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('点击"生成拼图预览"按钮查看效果', canvas.width / 2, canvas.height / 2)
        return
      }

      console.log('Drawing puzzle:', {
        direction: puzzleState.direction,
        mainImages: puzzleState.mainImages.length,
        subImages: puzzleState.subImages.length,
        loadedImages: Object.keys(loadedImages).length
      })

      // 计算图片的平均宽高比
      const getAverageAspectRatio = (images: PuzzleImageItem[]) => {
        if (images.length === 0) return 1
        let totalRatio = 0
        let count = 0
        images.forEach(img => {
          if (loadedImages[img.url]) {
            const htmlImg = loadedImages[img.url]
            totalRatio += htmlImg.width / htmlImg.height
            count++
          }
        })
        return count > 0 ? totalRatio / count : 1
      }
      
      // 生成布局配置
      const layoutConfig = generatePuzzleLayout(
        puzzleState.layout,
        puzzleState.customCanvasSize || puzzleState.canvasSize,
        puzzleState.spacing,
        puzzleState.subPerMain,
        puzzleState.direction,
        puzzleState.mainImages.length,
        puzzleState.subImages.length,
        puzzleState.subRatio || 0.3  // 传递次图配比
      )

      console.log('Layout config:', layoutConfig)

      // 实现均匀分配逻辑
      const { distributedMainImages, distributedSubImages } = distributeImages(
        puzzleState.mainImages,
        puzzleState.subImages,
        layoutConfig,
        puzzleState.layout,
        puzzleState.subPerMain
      )

      // 绘制图片的辅助函数，保持宽高比
      const drawImageKeepAspectRatio = (
        img: HTMLImageElement,
        region: { x: number; y: number; width: number; height: number },
        fit: 'contain' | 'cover' = 'contain'  // 默认改为contain，确保图片完全显示
      ) => {
        const imgAspect = img.width / img.height
        const regionAspect = region.width / region.height
        
        let drawWidth = region.width
        let drawHeight = region.height
        let offsetX = 0
        let offsetY = 0
        
        if (fit === 'contain') {
          // 图片完全显示在区域内，可能有留白
          if (imgAspect > regionAspect) {
            // 图片更宽，按宽度适配
            drawWidth = region.width
            drawHeight = drawWidth / imgAspect
            offsetY = (region.height - drawHeight) / 2
          } else {
            // 图片更高，按高度适配
            drawHeight = region.height
            drawWidth = drawHeight * imgAspect
            offsetX = (region.width - drawWidth) / 2
          }
        } else {
          // 图片填满区域，可能会裁剪
          if (imgAspect > regionAspect) {
            // 图片更宽，按高度适配
            drawHeight = region.height
            drawWidth = drawHeight * imgAspect
            offsetX = (region.width - drawWidth) / 2
          } else {
            // 图片更高，按宽度适配
            drawWidth = region.width
            drawHeight = drawWidth / imgAspect
            offsetY = (region.height - drawHeight) / 2
          }
        }
        
        // 绘制背景（可选，用于调试）
        if (false) {  // 调试时可以改为true查看区域边界
          ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'
          ctx.fillRect(region.x, region.y, region.width, region.height)
        }
        
        // 绘制图片
        ctx.drawImage(
          img,
          region.x + offsetX,
          region.y + offsetY,
          drawWidth,
          drawHeight
        )
      }
      
      // 绘制分配后的主图
      layoutConfig.mainRegions.forEach((region, index) => {
        const image = distributedMainImages[index]
        console.log(`Drawing main image ${index}:`, image?.name, !!loadedImages[image?.url || ''], 'at region:', region)
        if (image && loadedImages[image.url]) {
          const img = loadedImages[image.url]
          drawImageKeepAspectRatio(img, region, 'contain')  // 使用contain模式
          console.log(`Drew main image at:`, region)
        }
      })

      // 绘制分配后的次图
      layoutConfig.subRegions.forEach((region, index) => {
        const image = distributedSubImages[index]
        console.log(`Drawing sub image ${index}:`, image?.name, !!loadedImages[image?.url || ''], 'at region:', region)
        if (image && loadedImages[image.url]) {
          const img = loadedImages[image.url]
          drawImageKeepAspectRatio(img, region, 'contain')  // 使用contain模式
          console.log(`Drew sub image at:`, region)
        }
      })
    }

    drawCanvas()
  }, [
    puzzleState.backgroundColor,
    puzzleState.showPuzzle,
    puzzleState.direction,  // 添加direction作为依赖
    puzzleState.layout,
    puzzleState.spacing,
    puzzleState.subPerMain,  // 使用subPerMain替代customLayout
    puzzleState.subRatio,  // 添加subRatio作为依赖
    puzzleState.mainImages.length,
    puzzleState.subImages.length,
    puzzleState.canvasSize.width,
    puzzleState.canvasSize.height,
    puzzleState.customCanvasSize?.width,
    puzzleState.customCanvasSize?.height,
    Object.keys(loadedImages).length
  ])

  // 设置画布尺寸
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const currentSize = puzzleState.customCanvasSize || puzzleState.canvasSize
    canvas.width = currentSize.width
    canvas.height = currentSize.height
    // 画布尺寸改变后会自动触发重新绘制，不需要手动调用
  }, [puzzleState.canvasSize, puzzleState.customCanvasSize])

  // 居中画布
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const containerRect = container.getBoundingClientRect()
    const currentSize = puzzleState.customCanvasSize || puzzleState.canvasSize
    const canvasWidth = currentSize.width * puzzleState.zoom
    const canvasHeight = currentSize.height * puzzleState.zoom

    setCanvasOffset({
      x: (containerRect.width - canvasWidth) / 2,
      y: (containerRect.height - canvasHeight) / 2
    })
  }, [puzzleState.canvasSize, puzzleState.customCanvasSize, puzzleState.zoom])

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCanvasOffset({
        x: canvasOffset.x + e.movementX,
        y: canvasOffset.y + e.movementY
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: isDragging ? 'move' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${puzzleState.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute'
        }}
      >
        <canvas
          ref={canvasRef}
          className="bg-white shadow-lg"
          style={{
            width: (puzzleState.customCanvasSize || puzzleState.canvasSize).width,
            height: (puzzleState.customCanvasSize || puzzleState.canvasSize).height
          }}
        />
      </div>
    </div>
  )
}
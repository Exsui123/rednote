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

  // 加载所有图片（包括主图和次图）
  useEffect(() => {
    const loadImages = async () => {
      // 合并所有图片（主图和次图）
      const allImages = [...puzzleState.mainImages, ...puzzleState.subImages]
      
      const imagePromises = allImages.map(async (imageItem) => {
        return new Promise<[string, HTMLImageElement | null]>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve([imageItem.url, img])
          img.onerror = () => {
            // 静默处理错误，避免控制台污染
            // console.warn(`Failed to load image: ${imageItem.name}`)
            resolve([imageItem.url, null])
          }
          // 对于base64图片，直接使用；对于URL，添加时间戳避免缓存问题
          if (imageItem.url.startsWith('data:')) {
            img.src = imageItem.url
          } else {
            img.src = imageItem.url
          }
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

    // 当主图或次图有内容时加载
    if (puzzleState.mainImages.length > 0 || puzzleState.subImages.length > 0) {
      loadImages()
    }
  }, [puzzleState.mainImages, puzzleState.subImages])

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

      // 计算当前批次的图片范围
      const mainStartIdx = puzzleState.currentBatchIndex * puzzleState.mainPerPage
      const mainEndIdx = Math.min(mainStartIdx + puzzleState.mainPerPage, puzzleState.mainImages.length)
      const batchMainImages = puzzleState.mainImages.slice(mainStartIdx, mainEndIdx)
      
      // 计算对应的次图范围
      const subStartIdx = mainStartIdx * puzzleState.subPerMain
      const subEndIdx = Math.min(subStartIdx + (mainEndIdx - mainStartIdx) * puzzleState.subPerMain, puzzleState.subImages.length)
      const batchSubImages = puzzleState.subImages.slice(subStartIdx, subEndIdx)

      console.log('Drawing puzzle batch:', {
        batchIndex: puzzleState.currentBatchIndex,
        totalBatches: puzzleState.totalBatches,
        mainImages: `${mainStartIdx}-${mainEndIdx} of ${puzzleState.mainImages.length}`,
        subImages: `${subStartIdx}-${subEndIdx} of ${puzzleState.subImages.length}`,
        batchMainCount: batchMainImages.length,
        batchSubCount: batchSubImages.length
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
      
      // 生成布局配置 - 使用当前批次的数量
      const layoutConfig = generatePuzzleLayout(
        puzzleState.layout,
        puzzleState.customCanvasSize || puzzleState.canvasSize,
        puzzleState.spacing,
        puzzleState.subPerMain,
        puzzleState.direction,
        batchMainImages.length,  // 使用当前批次的主图数
        batchSubImages.length,   // 使用当前批次的次图数
        puzzleState.subRatio  // 传递次图配比
      )

      console.log('Layout config:', layoutConfig)

      // 实现均匀分配逻辑 - 使用当前批次的图片
      const { distributedMainImages, distributedSubImages } = distributeImages(
        batchMainImages,
        batchSubImages,
        layoutConfig,
        puzzleState.layout,
        puzzleState.subPerMain
      )

      // 绘制分配后的主图 - 使用和导出相同的方式
      layoutConfig.mainRegions.forEach((region, index) => {
        const image = distributedMainImages[index]
        console.log(`Drawing main image ${index}:`, image?.name, !!loadedImages[image?.url || ''], 'at region:', region)
        // 检查 isVisible 属性，如果为 false 则不绘制
        if (image && loadedImages[image.url] && image.isVisible !== false) {
          const img = loadedImages[image.url]
          // 直接绘制，填满整个区域（和导出保持一致）
          ctx.drawImage(
            img,
            region.x,
            region.y,
            region.width,
            region.height
          )
          console.log(`Drew main image at:`, region)
        }
      })

      // 绘制分配后的次图 - 使用和导出相同的方式
      layoutConfig.subRegions.forEach((region, index) => {
        const image = distributedSubImages[index]
        console.log(`Drawing sub image ${index}:`, image?.name, !!loadedImages[image?.url || ''], 'at region:', region)
        // 检查 isVisible 属性，如果为 false 则不绘制
        if (image && loadedImages[image.url] && image.isVisible !== false) {
          const img = loadedImages[image.url]
          // 直接绘制，填满整个区域（和导出保持一致）
          ctx.drawImage(
            img,
            region.x,
            region.y,
            region.width,
            region.height
          )
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
    puzzleState.mainPerPage,  // 添加mainPerPage作为依赖
    puzzleState.subRatio,  // 添加subRatio作为依赖
    puzzleState.currentBatchIndex,  // 添加当前批次索引作为依赖
    puzzleState.totalBatches,  // 添加总批次数作为依赖
    puzzleState.mainImages,  // 改为整个数组，以监听 isVisible 变化
    puzzleState.subImages,   // 改为整个数组，以监听 isVisible 变化
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
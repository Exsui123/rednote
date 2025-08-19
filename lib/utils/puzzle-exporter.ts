import { PptPuzzleState } from "@/lib/types/ppt-puzzle"
import { ExportSettings } from "@/lib/types"
import { generatePuzzleLayout } from "./puzzle-layout"

export async function exportPuzzleImage(
  puzzleState: PptPuzzleState, 
  exportSettings: ExportSettings
): Promise<void> {
  // 创建离屏画布
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法创建画布上下文')
  }

  // 设置画布尺寸
  const currentSize = puzzleState.customCanvasSize || puzzleState.canvasSize
  canvas.width = currentSize.width
  canvas.height = currentSize.height

  // 填充背景色
  ctx.fillStyle = puzzleState.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 生成布局配置
  const layoutConfig = generatePuzzleLayout(
    puzzleState.layout,
    currentSize,
    puzzleState.spacing,
    puzzleState.subPerMain,
    puzzleState.direction,
    puzzleState.mainImages.length,
    puzzleState.subImages.length,
    puzzleState.subRatio || 0.3  // 传递次图比例
  )

  // 使用与canvas相同的分配逻辑
  const distributedMainImages: (typeof puzzleState.mainImages[0] | undefined)[] = []
  const distributedSubImages: (typeof puzzleState.subImages[0] | undefined)[] = []
  
  // 分配主图
  for (let i = 0; i < layoutConfig.mainRegions.length; i++) {
    distributedMainImages[i] = puzzleState.mainImages[i] || undefined
  }
  
  // 按照新规则分配次图：每个主图配subPerMain个次图
  let subImageIndex = 0
  for (let mainIndex = 0; mainIndex < layoutConfig.mainRegions.length; mainIndex++) {
    const subsForThisMain = Math.min(puzzleState.subPerMain, puzzleState.subImages.length - subImageIndex)
    
    for (let i = 0; i < subsForThisMain; i++) {
      const regionIndex = mainIndex * puzzleState.subPerMain + i
      if (regionIndex < layoutConfig.subRegions.length && subImageIndex < puzzleState.subImages.length) {
        distributedSubImages[regionIndex] = puzzleState.subImages[subImageIndex]
        subImageIndex++
      }
    }
  }

  // 绘制主图
  for (let i = 0; i < layoutConfig.mainRegions.length; i++) {
    const region = layoutConfig.mainRegions[i]
    const imageItem = distributedMainImages[i]
    
    if (imageItem) {
      try {
        const img = await loadImage(imageItem.url)
        ctx.drawImage(img, region.x, region.y, region.width, region.height)
      } catch (error) {
        console.warn(`加载主图失败: ${imageItem.name}`, error)
      }
    }
  }

  // 绘制次图
  for (let i = 0; i < layoutConfig.subRegions.length; i++) {
    const region = layoutConfig.subRegions[i]
    const imageItem = distributedSubImages[i]
    
    if (imageItem) {
      try {
        const img = await loadImage(imageItem.url)
        ctx.drawImage(img, region.x, region.y, region.width, region.height)
      } catch (error) {
        console.warn(`加载次图失败: ${imageItem.name}`, error)
      }
    }
  }

  // 导出图片
  const dataUrl = canvas.toDataURL(
    `image/${exportSettings.format}`,
    exportSettings.quality
  )

  // 下载图片
  const link = document.createElement('a')
  const layoutName = puzzleState.layout === 'custom' 
    ? `custom-${puzzleState.mainImages.length}m-${puzzleState.subImages.length}s` 
    : puzzleState.layout
  link.download = `ppt-puzzle-${layoutName}-${Date.now()}.${exportSettings.format}`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // 创建一个空白图片作为后备
      const fallbackImg = new Image()
      resolve(fallbackImg)
    }
    img.src = url
  })
}
import JSZip from 'jszip'
import { PptPuzzleState } from "@/lib/types/ppt-puzzle"
import { ExportSettings } from "@/lib/types"
import { generatePuzzleLayout } from "./puzzle-layout"

export async function exportBatchPuzzleImages(
  puzzleState: PptPuzzleState,
  exportSettings: ExportSettings
): Promise<void> {
  const { mainImages, subImages, mainPerPage, subPerMain, totalBatches } = puzzleState
  
  // 如果只有一页，使用原有的单图导出逻辑
  if (totalBatches <= 1) {
    await exportSinglePuzzleImage(puzzleState, exportSettings, 0)
    return
  }
  
  // 创建ZIP包
  const zip = new JSZip()
  
  // 为每个批次生成图片
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    // 计算当前批次的图片范围
    const mainStartIdx = batchIndex * mainPerPage
    const mainEndIdx = Math.min(mainStartIdx + mainPerPage, mainImages.length)
    const batchMainImages = mainImages.slice(mainStartIdx, mainEndIdx)
    
    // 计算对应的次图范围
    const subStartIdx = mainStartIdx * subPerMain
    const subEndIdx = Math.min(subStartIdx + (mainEndIdx - mainStartIdx) * subPerMain, subImages.length)
    const batchSubImages = subImages.slice(subStartIdx, subEndIdx)
    
    // 生成当前批次的图片
    const blob = await generateBatchImage(
      puzzleState,
      batchMainImages,
      batchSubImages,
      exportSettings
    )
    
    // 添加到ZIP包
    const fileName = `puzzle-${String(batchIndex + 1).padStart(3, '0')}.${exportSettings.format}`
    zip.file(fileName, blob)
  }
  
  // 生成并下载ZIP文件
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.download = `ppt-puzzles-${Date.now()}.zip`
  link.href = URL.createObjectURL(zipBlob)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

async function exportSinglePuzzleImage(
  puzzleState: PptPuzzleState,
  exportSettings: ExportSettings,
  batchIndex: number
): Promise<void> {
  // 计算当前批次的图片范围
  const mainStartIdx = batchIndex * puzzleState.mainPerPage
  const mainEndIdx = Math.min(mainStartIdx + puzzleState.mainPerPage, puzzleState.mainImages.length)
  const batchMainImages = puzzleState.mainImages.slice(mainStartIdx, mainEndIdx)
  
  // 计算对应的次图范围
  const subStartIdx = mainStartIdx * puzzleState.subPerMain
  const subEndIdx = Math.min(subStartIdx + (mainEndIdx - mainStartIdx) * puzzleState.subPerMain, puzzleState.subImages.length)
  const batchSubImages = puzzleState.subImages.slice(subStartIdx, subEndIdx)
  
  const blob = await generateBatchImage(
    puzzleState,
    batchMainImages,
    batchSubImages,
    exportSettings
  )
  
  // 下载单张图片
  const link = document.createElement('a')
  const layoutName = puzzleState.layout === 'custom' 
    ? `custom-${batchMainImages.length}m-${batchSubImages.length}s` 
    : puzzleState.layout
  link.download = `ppt-puzzle-${layoutName}-${Date.now()}.${exportSettings.format}`
  link.href = URL.createObjectURL(blob)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

async function generateBatchImage(
  puzzleState: PptPuzzleState,
  batchMainImages: typeof puzzleState.mainImages,
  batchSubImages: typeof puzzleState.subImages,
  exportSettings: ExportSettings
): Promise<Blob> {
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
  
  // 生成布局配置 - 使用批次的实际数量
  const layoutConfig = generatePuzzleLayout(
    puzzleState.layout,
    currentSize,
    puzzleState.spacing,
    puzzleState.subPerMain,
    puzzleState.direction,
    batchMainImages.length,  // 使用当前批次的主图数
    batchSubImages.length,   // 使用当前批次的次图数
    puzzleState.subRatio || 0.3
  )
  
  // 使用与canvas相同的分配逻辑
  const distributedMainImages: (typeof batchMainImages[0] | undefined)[] = []
  const distributedSubImages: (typeof batchSubImages[0] | undefined)[] = []
  
  // 分配主图
  for (let i = 0; i < layoutConfig.mainRegions.length; i++) {
    distributedMainImages[i] = batchMainImages[i] || undefined
  }
  
  // 按照新规则分配次图：每个主图配subPerMain个次图
  let subImageIndex = 0
  for (let mainIndex = 0; mainIndex < layoutConfig.mainRegions.length; mainIndex++) {
    const subsForThisMain = Math.min(puzzleState.subPerMain, batchSubImages.length - subImageIndex)
    
    for (let i = 0; i < subsForThisMain; i++) {
      const regionIndex = mainIndex * puzzleState.subPerMain + i
      if (regionIndex < layoutConfig.subRegions.length && subImageIndex < batchSubImages.length) {
        distributedSubImages[regionIndex] = batchSubImages[subImageIndex]
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
  
  // 转换为Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('无法生成图片'))
        }
      },
      `image/${exportSettings.format}`,
      exportSettings.quality
    )
  })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}
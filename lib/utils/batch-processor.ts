import { EditorState, PerspectiveTransform, ExportSettings } from "@/lib/types"
import { drawPerspectiveImage } from "./perspective"
import JSZip from "jszip"

export interface ProcessResult {
  blob: Blob
  filename: string
}

export async function processImage(
  backgroundImage: HTMLImageElement,
  replaceImage: HTMLImageElement,
  transform: PerspectiveTransform,
  canvasSize: { width: number; height: number },
  exportSettings: ExportSettings
): Promise<Blob> {
  // 创建离屏 canvas
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize.width
  canvas.height = canvasSize.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 canvas context')
  
  // 绘制背景
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
  
  // 绘制透视变换后的替换图片
  drawPerspectiveImage(ctx, replaceImage, transform)
  
  // 导出为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('导出失败'))
      },
      `image/${exportSettings.format}`,
      exportSettings.quality
    )
  })
}

export async function batchProcess(
  editorState: EditorState,
  exportSettings: ExportSettings,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessResult[]> {
  if (!editorState.backgroundImage) {
    throw new Error('缺少背景图片')
  }
  
  const results: ProcessResult[] = []
  const bgImg = new Image()
  
  await new Promise((resolve) => {
    bgImg.onload = resolve
    bgImg.src = editorState.backgroundImage!.url
  })
  
  // 检查是否有共享变换参数
  if (!editorState.sharedTransform) {
    throw new Error('缺少变换参数，请先调整图片位置')
  }
  
  // 处理每张替换图片
  for (let i = 0; i < editorState.replaceImages.length; i++) {
    const replaceImage = editorState.replaceImages[i]
    
    const replaceImg = new Image()
    
    await new Promise((resolve) => {
      replaceImg.onload = resolve
      replaceImg.src = replaceImage.url
    })
    
    try {
      const blob = await processImage(
        bgImg,
        replaceImg,
        editorState.sharedTransform, // 使用全局共享的变换参数
        editorState.canvasSize,
        exportSettings
      )
      
      const filename = `processed_${i + 1}_${replaceImage.name.split('.')[0]}.${exportSettings.format}`
      
      results.push({ blob, filename })
      
      if (onProgress) {
        onProgress(i + 1, editorState.replaceImages.length)
      }
    } catch (error) {
      console.error(`处理图片 ${replaceImage.name} 失败:`, error)
    }
  }
  
  return results
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadAll(results: ProcessResult[]) {
  // 如果只有一个文件，直接下载
  if (results.length === 1) {
    downloadFile(results[0].blob, results[0].filename)
    return
  }
  
  // 多个文件，打包成 ZIP
  const zip = new JSZip()
  
  // 添加所有文件到 ZIP
  for (const result of results) {
    zip.file(result.filename, result.blob)
  }
  
  // 生成 ZIP 文件
  try {
    const zipBlob = await zip.generateAsync({ type: "blob" })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const zipFilename = `processed_images_${timestamp}.zip`
    downloadFile(zipBlob, zipFilename)
  } catch (error) {
    console.error('生成ZIP文件失败:', error)
    // 降级方案：逐个下载
    for (const result of results) {
      downloadFile(result.blob, result.filename)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}
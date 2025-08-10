import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const images = formData.getAll('images') as File[]
    const index = parseInt(formData.get('index') as string || '0')
    const textSettingsStr = formData.get('textSettings') as string | null
    const textSettings = textSettingsStr ? JSON.parse(textSettingsStr) : null
    const width = parseInt(formData.get('width') as string || '1920')
    const height = parseInt(formData.get('height') as string || '1080')
    
    if (images.length === 0 || index >= images.length) {
      return NextResponse.json(
        { error: '无效的图片索引' },
        { status: 400 }
      )
    }
    
    // 获取指定索引的图片
    const image = images[index]
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 使用Sharp处理图片
    let processedImage = sharp(buffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
    
    // 如果有文字设置，添加文字
    if (textSettings && textSettings.title) {
      const textY = textSettings.position === 'top' ? 50 : 
                   textSettings.position === 'center' ? height / 2 : 
                   height - 50
      
      // 创建SVG文字
      const svgText = `
        <svg width="${width}" height="${height}">
          <text 
            x="${width / 2}" 
            y="${textY}" 
            text-anchor="middle" 
            font-size="${textSettings.fontSize}" 
            fill="${textSettings.color}"
            font-family="sans-serif"
          >
            ${textSettings.title}
          </text>
        </svg>
      `
      
      processedImage = processedImage.composite([
        {
          input: Buffer.from(svgText),
          gravity: 'northwest'
        }
      ])
    }
    
    // 转换为buffer
    const outputBuffer = await processedImage.jpeg({ quality: 90 }).toBuffer()
    
    // 返回处理后的图片
    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache'
      }
    })
    
  } catch (error) {
    console.error('预览生成失败:', error)
    return NextResponse.json(
      { error: '预览生成失败' },
      { status: 500 }
    )
  }
}
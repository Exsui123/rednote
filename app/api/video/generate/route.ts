import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { FFmpegService } from '@/lib/services/ffmpeg-service'

export const maxDuration = 300 // 5分钟超时

export async function POST(request: NextRequest) {
  let tempFiles: string[] = []
  
  try {
    const formData = await request.formData()
    
    // 解析表单数据
    const images = formData.getAll('images') as File[]
    const durations = formData.getAll('durations') as string[]
    const settingsStr = formData.get('settings') as string
    const settings = JSON.parse(settingsStr)
    const audio = formData.get('audio') as File | null
    const audioSettingsStr = formData.get('audioSettings') as string | null
    const audioSettings = audioSettingsStr ? JSON.parse(audioSettingsStr) : null
    const textSettingsStr = formData.get('textSettings') as string | null
    const textSettings = textSettingsStr ? JSON.parse(textSettingsStr) : null
    
    if (images.length === 0) {
      return NextResponse.json(
        { error: '请上传至少一张图片' },
        { status: 400 }
      )
    }
    
    // 创建临时目录
    const tempDir = join(process.cwd(), 'public', 'temp')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }
    
    // 保存图片到临时目录
    const imagePaths: string[] = []
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `image_${Date.now()}_${i}.${image.name.split('.').pop()}`
      const filepath = join(tempDir, filename)
      await writeFile(filepath, buffer)
      imagePaths.push(filepath)
      tempFiles.push(filepath)
    }
    
    // 保存音频文件
    let audioPath: string | null = null
    if (audio) {
      const audioBytes = await audio.arrayBuffer()
      const audioBuffer = Buffer.from(audioBytes)
      const audioFilename = `audio_${Date.now()}.${audio.name.split('.').pop()}`
      audioPath = join(tempDir, audioFilename)
      await writeFile(audioPath, audioBuffer)
      tempFiles.push(audioPath)
    }
    
    // 生成输出文件名
    const outputFilename = `video_${Date.now()}.mp4`
    const outputPath = join(tempDir, outputFilename)
    
    // 初始化FFmpeg服务
    const ffmpegService = new FFmpegService()
    
    // 生成视频
    await ffmpegService.generateVideo({
      imagePaths,
      durations: durations.map(d => parseFloat(d)),
      outputPath,
      settings: {
        resolution: settings.resolution,
        aspectRatio: settings.aspectRatio,
        fps: settings.fps,
        globalTransition: settings.globalTransition,
        transitions: settings.transitions
      },
      audioPath,
      audioSettings,
      textSettings
    })
    
    // 返回视频URL
    const videoUrl = `/temp/${outputFilename}`
    
    // 设置定时删除临时文件（10分钟后）
    setTimeout(async () => {
      try {
        await unlink(outputPath)
        for (const file of tempFiles) {
          if (existsSync(file)) {
            await unlink(file)
          }
        }
      } catch (error) {
        console.error('清理临时文件失败:', error)
      }
    }, 10 * 60 * 1000)
    
    return NextResponse.json({
      success: true,
      url: videoUrl,
      filename: outputFilename
    })
    
  } catch (error) {
    // 清理临时文件
    for (const file of tempFiles) {
      try {
        if (existsSync(file)) {
          await unlink(file)
        }
      } catch (e) {
        console.error('清理文件失败:', e)
      }
    }
    
    console.error('视频生成失败:', error)
    return NextResponse.json(
      { error: '视频生成失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}
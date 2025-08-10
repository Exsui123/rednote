import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import { transitions, getTransitionCommand } from './ffmpeg-transitions'

// 设置FFmpeg路径
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

interface VideoGenerationOptions {
  imagePaths: string[]
  durations: number[]
  outputPath: string
  settings: {
    resolution: '720p' | '1080p' | '4k'
    aspectRatio?: '16:9' | '9:16' | '4:3' | '3:4' | '1:1'
    fps: 24 | 30 | 60
    globalTransition: string
    transitions: Record<string, string>
  }
  audioPath?: string | null
  audioSettings?: {
    volume: number
    loop: boolean
    fadeInOut: boolean
  } | null
  textSettings?: {
    title: string
    font: string
    fontSize: number
    color: string
    position: 'top' | 'center' | 'bottom' | 'custom'
    positionX?: number
    positionY?: number
    duration: 'full' | 'custom'
    customDuration?: number
  } | null
}

export class FFmpegService {
  private getResolution(resolution: string): { width: number; height: number } {
    switch (resolution) {
      case '720p':
        return { width: 1280, height: 720 }
      case '1080p':
        return { width: 1920, height: 1080 }
      case '4k':
        return { width: 3840, height: 2160 }
      default:
        return { width: 1920, height: 1080 }
    }
  }
  
  private getResolutionWithAspectRatio(resolution: string, aspectRatio?: string): { width: number; height: number } {
    const baseSize = resolution === '720p' ? 720 : 
                    resolution === '1080p' ? 1080 : 2160
    
    let width, height
    switch (aspectRatio || '16:9') {
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

  private getTransitionFilter(transition: string, duration: number = 1): string {
    switch (transition) {
      case 'fade':
        return `fade=t=in:st=0:d=${duration},fade=t=out:st=${duration}:d=${duration}`
      case 'slide':
        return `xfade=transition=slideleft:duration=${duration}:offset=0`
      case 'scale':
        return `xfade=transition=pinwheel:duration=${duration}:offset=0`
      case 'rotate':
        return `xfade=transition=circleopen:duration=${duration}:offset=0`
      case 'flip':
        return `xfade=transition=flipright:duration=${duration}:offset=0`
      case 'push':
        return `xfade=transition=slideup:duration=${duration}:offset=0`
      case 'wipe':
        return `xfade=transition=wipeleft:duration=${duration}:offset=0`
      case 'dissolve':
        return `xfade=transition=dissolve:duration=${duration}:offset=0`
      default:
        return `fade=t=in:st=0:d=${duration}`
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<void> {
    const { imagePaths, durations, outputPath, settings, audioPath, audioSettings, textSettings } = options
    const { width, height } = this.getResolutionWithAspectRatio(settings.resolution, settings.aspectRatio)
    
    // 暂时使用简单版本，确保基本功能正常
    return await this.generateSimpleVideoWithTransitions(options)

    return new Promise((resolve, reject) => {
      let command = ffmpeg()

      // 添加图片输入
      imagePaths.forEach((path, index) => {
        command = command.input(path)
          .inputOptions([
            '-loop', '1',
            '-t', durations[index].toString()
          ])
      })

      // 创建复杂的滤镜图
      let filterComplex = []
      let lastOutput = '0:v'

      // 缩放所有图片到目标分辨率
      for (let i = 0; i < imagePaths.length; i++) {
        filterComplex.push(
          `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${settings.fps}[v${i}]`
        )
      }

      // 应用转场效果
      if (imagePaths.length > 1) {
        let currentOutput = 'v0'
        
        for (let i = 1; i < imagePaths.length; i++) {
          const transitionKey = `${i-1}-${i}`
          const transition = settings.transitions[transitionKey] || settings.globalTransition || 'fade'
          const transitionDuration = 1 // 1秒转场时间
          
          const nextOutput = i === imagePaths.length - 1 ? 'outv' : `vt${i}`
          
          // 使用xfade滤镜进行转场
          filterComplex.push(
            `[${currentOutput}][v${i}]xfade=transition=${this.getXfadeTransition(transition)}:duration=${transitionDuration}:offset=${this.calculateOffset(durations, i, transitionDuration)}[${nextOutput}]`
          )
          
          currentOutput = nextOutput
        }
        
        lastOutput = 'outv'
      } else {
        lastOutput = 'v0'
      }

      // 添加文字叠加
      if (textSettings && textSettings.title) {
        const textY = textSettings.position === 'top' ? 50 : 
                     textSettings.position === 'center' ? `(h-text_h)/2` : 
                     `h-50`
        
        filterComplex.push(
          `[${lastOutput}]drawtext=text='${textSettings.title.replace(/'/g, "\\''")}':fontsize=${textSettings.fontSize}:fontcolor=${textSettings.color}:x=(w-text_w)/2:y=${textY}[vtext]`
        )
        lastOutput = 'vtext'
      }

      // 应用滤镜
      command = command.complexFilter(filterComplex, lastOutput)

      // 添加音频
      if (audioPath && existsSync(audioPath)) {
        command = command.input(audioPath)
        
        if (audioSettings) {
          let audioFilters = []
          
          // 音量调整
          if (audioSettings.volume !== 100) {
            audioFilters.push(`volume=${audioSettings.volume / 100}`)
          }
          
          // 淡入淡出
          if (audioSettings.fadeInOut) {
            const totalDuration = durations.reduce((sum, d) => sum + d, 0)
            audioFilters.push(`afade=t=in:st=0:d=2,afade=t=out:st=${totalDuration - 2}:d=2`)
          }
          
          if (audioFilters.length > 0) {
            command = command.audioFilters(audioFilters)
          }
          
          // 循环播放
          if (audioSettings.loop) {
            command = command.inputOptions(['-stream_loop', '-1'])
          }
        }
        
        command = command.outputOptions(['-shortest'])
      } else {
        command = command.noAudio()
      }

      // 输出设置
      command
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart'
        ])
        .fps(settings.fps)
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('开始生成视频:', commandLine)
        })
        .on('progress', (progress) => {
          console.log('处理进度:', progress.percent, '%')
        })
        .on('end', () => {
          console.log('视频生成完成')
          resolve()
        })
        .on('error', (err) => {
          console.error('视频生成失败:', err)
          reject(err)
        })
        .run()
    })
  }

  private getXfadeTransition(transition: string): string {
    // 使用新的转场配置系统
    return getTransitionCommand(transition)
  }

  private calculateOffset(durations: number[], index: number, transitionDuration: number): number {
    // 计算转场开始的时间偏移
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += durations[i]
      if (i > 0) {
        offset -= transitionDuration // 减去之前的转场时间重叠
      }
    }
    return Math.max(0, offset - transitionDuration)
  }

  async generateSimpleVideoWithTransitions(options: VideoGenerationOptions): Promise<void> {
    const { imagePaths, durations, outputPath, settings, audioPath, textSettings } = options
    const { width, height } = this.getResolutionWithAspectRatio(settings.resolution, settings.aspectRatio)
    
    return new Promise((resolve, reject) => {
      const fs = require('fs')
      
      try {
        let command = ffmpeg()
        let filterComplex = []
        
        // 添加所有图片输入
        imagePaths.forEach((path, index) => {
          command = command.input(path)
            .inputOptions(['-loop', '1', '-t', durations[index].toString()])
        })
        
        // 缩放所有图片
        for (let i = 0; i < imagePaths.length; i++) {
          filterComplex.push(
            `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
            `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,` +
            `setsar=1,fps=${settings.fps}[v${i}]`
          )
        }
        
        // 如果有多张图片，应用转场
        if (imagePaths.length > 1) {
          let currentInput = 'v0'
          
          for (let i = 1; i < imagePaths.length; i++) {
            const prevIndex = i - 1
            const transitionKey = Object.keys(settings.transitions).find(key => {
              const [from, to] = key.split('-')
              return key.includes(`${prevIndex}`) && key.includes(`${i}`)
            })
            
            const transition = transitionKey ? settings.transitions[transitionKey] : settings.globalTransition
            const transitionType = getTransitionCommand(transition)
            const outputName = i === imagePaths.length - 1 ? 'outv' : `vt${i}`
            
            // 计算偏移时间
            let offset = 0
            for (let j = 0; j < i; j++) {
              offset += durations[j] - 0.5 // 0.5秒转场重叠
            }
            
            filterComplex.push(
              `[${currentInput}][v${i}]xfade=transition=${transitionType}:` +
              `duration=0.5:offset=${Math.max(0, offset)}[${outputName}]`
            )
            
            currentInput = outputName
          }
          
          // 添加文字叠加
          if (textSettings && textSettings.title) {
            const textX = textSettings.position === 'custom' && textSettings.positionX ? 
              `${width * textSettings.positionX / 100}` : '(w-text_w)/2'
            const textY = textSettings.position === 'custom' && textSettings.positionY ?
              `${height * textSettings.positionY / 100}` :
              textSettings.position === 'center' ? '(h-text_h)/2' :
              textSettings.position === 'bottom' ? 'h-50' : '50'
            
            filterComplex.push(
              `[${currentInput}]drawtext=text='${textSettings.title.replace(/'/g, "\\''")}':` +
              `fontsize=${textSettings.fontSize}:fontcolor=${textSettings.color}:` +
              `x=${textX}:y=${textY}[vfinal]`
            )
            currentInput = 'vfinal'
          }
          
          command = command.complexFilter(filterComplex, currentInput)
        } else {
          // 单张图片处理
          let outputName = 'v0'
          
          if (textSettings && textSettings.title) {
            const textX = textSettings.position === 'custom' && textSettings.positionX ? 
              `${width * textSettings.positionX / 100}` : '(w-text_w)/2'
            const textY = textSettings.position === 'custom' && textSettings.positionY ?
              `${height * textSettings.positionY / 100}` :
              textSettings.position === 'center' ? '(h-text_h)/2' :
              textSettings.position === 'bottom' ? 'h-50' : '50'
            
            filterComplex.push(
              `[v0]drawtext=text='${textSettings.title.replace(/'/g, "\\''")}':` +
              `fontsize=${textSettings.fontSize}:fontcolor=${textSettings.color}:` +
              `x=${textX}:y=${textY}[vfinal]`
            )
            outputName = 'vfinal'
          }
          
          command = command.complexFilter(filterComplex, outputName)
        }
        
        // 添加音频
        if (audioPath && fs.existsSync(audioPath)) {
          command = command.input(audioPath)
            .outputOptions(['-shortest'])
        } else {
          command = command.noAudio()
        }
        
        // 输出设置
        command
          .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart'
          ])
          .fps(settings.fps)
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg命令:', commandLine)
          })
          .on('progress', (progress) => {
            console.log('处理进度:', progress.percent, '%')
          })
          .on('end', () => {
            console.log('视频生成成功')
            resolve()
          })
          .on('error', (err) => {
            console.error('视频生成失败:', err)
            reject(err)
          })
          .run()
      } catch (error) {
        reject(error)
      }
    })
  }
  
  async generateSimpleVideo(options: VideoGenerationOptions): Promise<void> {
    // 简化版本的视频生成，用于快速测试
    const { imagePaths, durations, outputPath, settings } = options
    const { width, height } = this.getResolution(settings.resolution)

    return new Promise((resolve, reject) => {
      // 创建一个临时的concat文件
      const concatFile = join(process.cwd(), 'public', 'temp', `concat_${Date.now()}.txt`)
      const fs = require('fs')
      
      // 生成concat文件内容
      let concatContent = ''
      imagePaths.forEach((path, index) => {
        concatContent += `file '${path}'\n`
        concatContent += `duration ${durations[index]}\n`
      })
      // 添加最后一张图片以避免结尾问题
      if (imagePaths.length > 0) {
        concatContent += `file '${imagePaths[imagePaths.length - 1]}'\n`
      }
      
      fs.writeFileSync(concatFile, concatContent)

      const command = ffmpeg()
        .input(concatFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          `-vf`, `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
          '-r', settings.fps.toString()
        ])
        .output(outputPath)
        .on('end', () => {
          fs.unlinkSync(concatFile)
          resolve()
        })
        .on('error', (err) => {
          fs.unlinkSync(concatFile)
          reject(err)
        })
        .run()
    })
  }
}
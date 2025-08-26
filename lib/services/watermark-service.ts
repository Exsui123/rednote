import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import * as mammoth from 'mammoth'
import { saveAs } from 'file-saver'
import type { WatermarkConfig, DocumentFile, WatermarkResult, WatermarkProgress } from '@/lib/types/watermark'

export class WatermarkService {
  private progressCallback?: (progress: WatermarkProgress) => void
  private rng: any

  constructor(progressCallback?: (progress: WatermarkProgress) => void) {
    this.progressCallback = progressCallback
    this.rng = this.createSeededRandom()
  }

  private reportProgress(stage: WatermarkProgress['stage'], progress: number, message: string) {
    this.progressCallback?.({
      stage,
      progress,
      message
    })
  }

  async processDocument(
    file: DocumentFile,
    config: WatermarkConfig
  ): Promise<WatermarkResult> {
    const startTime = Date.now()
    
    try {
      this.reportProgress('uploading', 10, '正在读取文件...')
      
      let pdfBytes: ArrayBuffer
      
      if (file.type === 'word') {
        this.reportProgress('converting', 30, '正在转换Word文档...')
        const convertedPdf = await this.convertWordToPdf(file.file)
        pdfBytes = convertedPdf.buffer as ArrayBuffer
      } else if (file.type === 'pdf') {
        pdfBytes = await file.file.arrayBuffer()
      } else {
        throw new Error('不支持的文件格式')
      }

      this.reportProgress('watermarking', 60, '正在添加水印...')
      const watermarkedBytes = await this.addWatermarkToPdf(pdfBytes, config)
      
      this.reportProgress('completed', 100, '处理完成')
      
      const processedBlob = new Blob([new Uint8Array(watermarkedBytes)], { type: 'application/pdf' })
      const downloadUrl = URL.createObjectURL(processedBlob)
      
      return {
        originalFile: file,
        processedBlob,
        downloadUrl,
        processTime: Date.now() - startTime
      }
    } catch (error) {
      this.reportProgress('error', 0, `处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      throw error
    }
  }

  private async convertWordToPdf(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    
    // 创建一个简单的PDF文档包含HTML内容
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4 尺寸
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    // 简单的HTML到PDF转换（实际项目中可能需要更复杂的转换）
    const text = result.value.replace(/<[^>]*>/g, '') // 移除HTML标签
    const hasChinese = /[\u4e00-\u9fff]/.test(text)
    const processedText = hasChinese ? this.toAscii(text) : text
    const lines = this.wrapText(processedText, 500, font, 12)
    
    let yPosition = page.getHeight() - 50
    for (const line of lines) {
      if (yPosition < 50) {
        const newPage = pdfDoc.addPage([595.28, 841.89])
        yPosition = newPage.getHeight() - 50
        newPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        })
      } else {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          font: font,
          color: rgb(0, 0, 0)
        })
      }
      yPosition -= 20
    }
    
    return await pdfDoc.save()
  }

  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  private async addWatermarkToPdf(
    pdfBytes: ArrayBuffer,
    config: WatermarkConfig
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes)
    
    // 检查是否包含中文字符
    const hasChinese = /[\u4e00-\u9fff]/.test(config.text)
    let font
    
    if (hasChinese) {
      // 对于中文字符，使用系统字体或创建一个简单的字体处理
      // 由于pdf-lib对中文支持有限，我们需要特殊处理
      try {
        // 尝试使用内置字体，如果失败则降级处理
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      } catch {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      }
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    }
    
    const pages = pdfDoc.getPages()
    
    // 解析颜色
    const color = this.parseColor(config.color)
    
    for (const page of pages) {
      await this.addWatermarkToPage(page, config, font, color, hasChinese)
    }
    
    return await pdfDoc.save()
  }

  private async addWatermarkToPage(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    hasChinese: boolean = false
  ) {
    const { width, height } = page.getSize()
    
    switch (config.pattern) {
      case 'single':
        this.drawSingleWatermark(page, config, font, color, width, height, hasChinese)
        break
      case 'repeat':
      case 'grid':
        this.drawGridWatermark(page, config, font, color, width, height, hasChinese)
        break
      case 'diagonal':
        this.drawDiagonalWatermark(page, config, font, color, width, height, hasChinese)
        break
      case 'paranoid':
        this.drawParanoidWatermark(page, config, font, color, width, height, hasChinese)
        break
      case 'anti-removal':
        this.drawAntiRemovalWatermark(page, config, font, color, width, height, hasChinese)
        break
    }
  }

  private drawSingleWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean = false
  ) {
    const { x, y } = this.getWatermarkPosition(
      config.position,
      pageWidth,
      pageHeight,
      config.fontSize
    )
    
    this.drawTextSafely(page, config, font, color, x, y, hasChinese)
  }

  private drawGridWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean = false
  ) {
    const textWidth = hasChinese ? config.fontSize * config.text.length : this.getTextWidthSafely(font, config.text, config.fontSize)
    const spacing = config.spacing || 100
    
    for (let x = textWidth / 2; x < pageWidth; x += textWidth + spacing) {
      for (let y = config.fontSize; y < pageHeight; y += config.fontSize + spacing) {
        this.drawTextSafely(page, config, font, color, x, y, hasChinese)
      }
    }
  }

  private drawDiagonalWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean = false
  ) {
    const textWidth = hasChinese ? config.fontSize * config.text.length : this.getTextWidthSafely(font, config.text, config.fontSize)
    const spacing = config.spacing || 150
    
    // 创建对角线网格模式
    const stepX = textWidth + spacing
    const stepY = config.fontSize + spacing
    
    // 计算需要多少行和列来覆盖整个页面
    const cols = Math.ceil(pageWidth / stepX) + 1
    const rows = Math.ceil(pageHeight / stepY) + 1
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * stepX
        const y = row * stepY
        
        if (x < pageWidth && y < pageHeight) {
          // 使用自定义旋转角度而不是固定+45度
          const customConfig = { ...config, rotation: config.rotation }
          this.drawTextSafely(page, customConfig, font, color, x, y, hasChinese)
        }
      }
    }
  }

  private getWatermarkPosition(
    position: WatermarkConfig['position'],
    pageWidth: number,
    pageHeight: number,
    fontSize: number
  ): { x: number; y: number } {
    const centerX = pageWidth / 2
    const centerY = pageHeight / 2
    
    switch (position) {
      case 'center':
        return { x: centerX, y: centerY }
      case 'top-left':
        return { x: 50, y: pageHeight - 50 }
      case 'top-center':
        return { x: centerX, y: pageHeight - 50 }
      case 'top-right':
        return { x: pageWidth - 100, y: pageHeight - 50 }
      case 'middle-left':
        return { x: 50, y: centerY }
      case 'middle-right':
        return { x: pageWidth - 100, y: centerY }
      case 'bottom-left':
        return { x: 50, y: 50 }
      case 'bottom-center':
        return { x: centerX, y: 50 }
      case 'bottom-right':
        return { x: pageWidth - 100, y: 50 }
      default:
        return { x: centerX, y: centerY }
    }
  }

  private parseColor(colorString: string): { r: number; g: number; b: number } {
    // 支持 #RGB 和 #RRGGBB 格式
    const hex = colorString.replace('#', '')
    
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16) / 255,
        g: parseInt(hex[1] + hex[1], 16) / 255,
        b: parseInt(hex[2] + hex[2], 16) / 255
      }
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.substr(0, 2), 16) / 255,
        g: parseInt(hex.substr(2, 2), 16) / 255,
        b: parseInt(hex.substr(4, 2), 16) / 255
      }
    }
    
    // 默认黑色
    return { r: 0, g: 0, b: 0 }
  }

  private drawTextSafely(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    x: number,
    y: number,
    hasChinese: boolean = false
  ) {
    try {
      if (hasChinese) {
        // 对于包含中文的文本，使用替代方案
        // 将中文字符替换为拼音或英文占位符
        const fallbackText = this.createFallbackText(config.text)
        page.drawText(fallbackText, {
          x,
          y,
          size: config.fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity: config.opacity,
          rotate: degrees(config.rotation)
        })
      } else {
        page.drawText(config.text, {
          x,
          y,
          size: config.fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
          opacity: config.opacity,
          rotate: degrees(config.rotation)
        })
      }
    } catch (error) {
      // 如果绘制失败，使用ASCII替代字符
      const asciiText = this.toAscii(config.text)
      page.drawText(asciiText, {
        x,
        y,
        size: config.fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: config.opacity,
        rotate: degrees(config.rotation)
      })
    }
  }

  private getTextWidthSafely(font: any, text: string, fontSize: number): number {
    try {
      return font.widthOfTextAtSize(text, fontSize)
    } catch {
      // 如果无法计算宽度，使用估算值
      return fontSize * text.length * 0.6
    }
  }

  private createFallbackText(text: string): string {
    // 创建一个包含相似字符数量的ASCII替代文本
    return text.replace(/[\u4e00-\u9fff]/g, 'W') // 使用 'W' 替代中文字符，因为它比较宽
  }

  private toAscii(text: string): string {
    // 将所有非ASCII字符转换为问号或其他ASCII字符
    return text.replace(/[^\x00-\x7F]/g, '?')
  }

  // ===== 高强度水印防护算法 =====

  // 混合水印策略：结合多种渲染方式，增加去水印难度
  private applyHybridWatermarkStrategy(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean
  ) {
    // 策略1：模拟Word风格水印
    this.drawWordStyleWatermark(page, config, font, color, pageWidth, pageHeight, hasChinese)
    
    // 策略2：自定义随机化水印
    this.drawMultiLayerProtection(page, config, font, color, pageWidth, pageHeight, hasChinese)
    
    // 策略3：频域隐藏水印（简化版）
    this.drawFrequencyDomainWatermark(page, config, font, color, pageWidth, pageHeight, hasChinese)
  }

  // 模拟Word风格的水印，对抗专门针对网页水印的算法
  private drawWordStyleWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean
  ) {
    // 使用Word的典型水印参数
    const wordConfig = {
      ...config,
      opacity: 0.15, // Word的典型透明度
      rotation: -45, // Word的默认角度
      fontSize: Math.max(config.fontSize * 1.5, 48) // Word的典型大小
    }
    
    // 模拟Word的规律性布局
    const spacing = wordConfig.fontSize * 3
    for (let x = spacing; x < pageWidth; x += spacing) {
      for (let y = spacing; y < pageHeight; y += spacing) {
        try {
          const text = hasChinese ? this.createFallbackText(wordConfig.text) : wordConfig.text
          page.drawText(text, {
            x: x,
            y: y,
            size: wordConfig.fontSize,
            font,
            color: rgb(0.8, 0.8, 0.8), // Word的典型灰色
            opacity: wordConfig.opacity,
            rotate: degrees(wordConfig.rotation)
          })
        } catch (error) {
          // 静默失败
        }
      }
    }
  }

  // 频域水印：在不同频率层添加微弱信号
  private drawFrequencyDomainWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean
  ) {
    // 在不同的空间频率上添加极微弱的水印
    const frequencies = [
      { scale: 0.1, opacity: 0.03 }, // 高频细节
      { scale: 0.3, opacity: 0.05 }, // 中频
      { scale: 0.6, opacity: 0.08 }  // 低频
    ]
    
    frequencies.forEach(freq => {
      const scaledSpacing = (config.spacing || 150) * freq.scale
      const scaledFont = config.fontSize * freq.scale
      
      for (let x = 0; x < pageWidth; x += scaledSpacing) {
        for (let y = 0; y < pageHeight; y += scaledSpacing) {
          try {
            // 使用点符号作为频域标记
            page.drawText('·', {
              x: x,
              y: y,
              size: Math.max(scaledFont, 3),
              font,
              color: rgb(color.r, color.g, color.b),
              opacity: freq.opacity,
              rotate: degrees(config.rotation + Math.sin(x + y) * 15) // 微弱的正弦变化
            })
          } catch (error) {
            // 静默失败
          }
        }
      }
    })
  }

  private createSeededRandom(seed?: string): any {
    const actualSeed = seed || 'default-seed'
    let hash = 0
    for (let i = 0; i < actualSeed.length; i++) {
      const char = actualSeed.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    
    return {
      seed: Math.abs(hash),
      next: function() {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
      }
    }
  }

  private drawParanoidWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean = false
  ) {
    // 重置随机种子以确保可重复性
    this.rng = this.createSeededRandom(config.randomSeed || config.text)
    
    // 使用混合水印策略：结合多种算法特征
    this.applyHybridWatermarkStrategy(page, config, font, color, pageWidth, pageHeight, hasChinese)
  }

  // 反去水印模式：专门对抗去水印算法
  private drawAntiRemovalWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean = false
  ) {
    this.rng = this.createSeededRandom(config.randomSeed || config.text)
    
    // 策略1: 多重混合渲染
    this.applyHybridWatermarkStrategy(page, config, font, color, pageWidth, pageHeight, hasChinese)
    
    // 策略2: 对抗特征检测
    this.drawAntiDetectionLayer(page, config, font, color, pageWidth, pageHeight, hasChinese)
    
    // 策略3: 内容相关性水印
    this.drawContentAwareWatermark(page, config, font, color, pageWidth, pageHeight, hasChinese)
  }

  // 对抗特征检测层
  private drawAntiDetectionLayer(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean
  ) {
    // 添加假水印特征，混淆去水印算法
    const fakeFeatures = [
      { opacity: 0.02, rotation: 0, text: '.' },
      { opacity: 0.03, rotation: 90, text: '|' },
      { opacity: 0.025, rotation: 45, text: '/' }
    ]
    
    fakeFeatures.forEach(fake => {
      for (let x = 20; x < pageWidth - 20; x += 40) {
        for (let y = 20; y < pageHeight - 20; y += 40) {
          const jitterX = (this.rng.next() - 0.5) * 20
          const jitterY = (this.rng.next() - 0.5) * 20
          
          try {
            page.drawText(fake.text, {
              x: x + jitterX,
              y: y + jitterY,
              size: 8 + this.rng.next() * 4,
              font,
              color: rgb(color.r + (this.rng.next() - 0.5) * 0.2, color.g, color.b),
              opacity: fake.opacity,
              rotate: degrees(fake.rotation + (this.rng.next() - 0.5) * 30)
            })
          } catch (error) {
            // 静默失败
          }
        }
      }
    })
  }

  // 内容相关性水印
  private drawContentAwareWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean
  ) {
    // 基于页面几何特征的水印分布
    const zones = [
      { x: pageWidth * 0.1, y: pageHeight * 0.1, density: 0.3 },
      { x: pageWidth * 0.5, y: pageHeight * 0.3, density: 0.5 },
      { x: pageWidth * 0.8, y: pageHeight * 0.7, density: 0.4 },
      { x: pageWidth * 0.3, y: pageHeight * 0.8, density: 0.6 }
    ]
    
    zones.forEach(zone => {
      const count = Math.floor(zone.density * 20)
      for (let i = 0; i < count; i++) {
        const radius = 50 + this.rng.next() * 100
        const angle = this.rng.next() * 2 * Math.PI
        const x = zone.x + Math.cos(angle) * radius * this.rng.next()
        const y = zone.y + Math.sin(angle) * radius * this.rng.next()
        
        if (x > 0 && x < pageWidth && y > 0 && y < pageHeight) {
          try {
            const adaptiveText = hasChinese ? this.createFallbackText(config.text) : config.text
            const adaptiveSize = config.fontSize * (0.5 + zone.density * 0.8)
            const adaptiveOpacity = config.opacity * (0.3 + zone.density * 0.4)
            
            page.drawText(adaptiveText, {
              x,
              y,
              size: adaptiveSize,
              font,
              color: rgb(color.r, color.g, color.b),
              opacity: adaptiveOpacity,
              rotate: degrees(config.rotation + (this.rng.next() - 0.5) * 90)
            })
          } catch (error) {
            // 静默失败
          }
        }
      }
    })
  }

  private drawMultiLayerProtection(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean
  ) {
    // 第1层：随机化网格
    this.drawRandomizedGrid(page, config, font, color, pageWidth, pageHeight, hasChinese, 0.8)
    
    // 第2层：噪声水印
    this.drawNoiseWatermarks(page, config, font, color, pageWidth, pageHeight, hasChinese, 0.3)
    
    // 第3层：边界混淆
    this.drawBoundaryConfusion(page, config, font, color, pageWidth, pageHeight, hasChinese, 0.2)
    
    // 第4层：微观水印
    this.drawMicroWatermarks(page, config, font, color, pageWidth, pageHeight, hasChinese, 0.1)
  }

  private drawRandomizedGrid(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean,
    opacityMultiplier: number
  ) {
    const baseSpacing = config.spacing || 120
    const variations = this.generateWatermarkVariations(config, 5)
    
    // 创建不规则网格
    for (let x = 0; x < pageWidth; x += baseSpacing) {
      for (let y = 0; y < pageHeight; y += baseSpacing) {
        // 随机偏移位置
        const offsetX = (this.rng.next() - 0.5) * baseSpacing * 0.6
        const offsetY = (this.rng.next() - 0.5) * baseSpacing * 0.6
        
        const finalX = x + offsetX
        const finalY = y + offsetY
        
        if (finalX > 0 && finalX < pageWidth && finalY > 0 && finalY < pageHeight) {
          // 随机选择变体
          const variant = variations[Math.floor(this.rng.next() * variations.length)]
          const adjustedOpacity = variant.opacity * opacityMultiplier
          
          this.drawVariantWatermark(page, variant, font, color, finalX, finalY, adjustedOpacity, hasChinese)
        }
      }
    }
  }

  private drawNoiseWatermarks(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean,
    opacityMultiplier: number
  ) {
    // 添加随机噪声水印，破坏规律性
    const noiseCount = Math.floor((pageWidth * pageHeight) / 50000) // 根据页面大小调整噪声数量
    
    for (let i = 0; i < noiseCount; i++) {
      const x = this.rng.next() * pageWidth
      const y = this.rng.next() * pageHeight
      
      // 创建微小变体
      const noiseConfig = {
        ...config,
        fontSize: config.fontSize * (0.5 + this.rng.next() * 0.5), // 随机大小
        rotation: this.rng.next() * 360, // 完全随机旋转
        text: this.generateNoiseText(config.text)
      }
      
      const adjustedOpacity = config.opacity * opacityMultiplier * (0.3 + this.rng.next() * 0.4)
      this.drawVariantWatermark(page, noiseConfig, font, color, x, y, adjustedOpacity, hasChinese)
    }
  }

  private drawBoundaryConfusion(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean,
    opacityMultiplier: number
  ) {
    // 在页面边界添加混淆水印
    const margin = 50
    const step = config.fontSize * 2
    
    // 顶部和底部边界
    for (let x = margin; x < pageWidth - margin; x += step) {
      const topY = margin + (this.rng.next() - 0.5) * 20
      const bottomY = pageHeight - margin + (this.rng.next() - 0.5) * 20
      
      const confusionConfig = this.createConfusionVariant(config)
      const opacity = config.opacity * opacityMultiplier
      
      this.drawVariantWatermark(page, confusionConfig, font, color, x, topY, opacity, hasChinese)
      this.drawVariantWatermark(page, confusionConfig, font, color, x, bottomY, opacity, hasChinese)
    }
    
    // 左右边界
    for (let y = margin; y < pageHeight - margin; y += step) {
      const leftX = margin + (this.rng.next() - 0.5) * 20
      const rightX = pageWidth - margin + (this.rng.next() - 0.5) * 20
      
      const confusionConfig = this.createConfusionVariant(config)
      const opacity = config.opacity * opacityMultiplier
      
      this.drawVariantWatermark(page, confusionConfig, font, color, leftX, y, opacity, hasChinese)
      this.drawVariantWatermark(page, confusionConfig, font, color, rightX, y, opacity, hasChinese)
    }
  }

  private drawMicroWatermarks(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    pageWidth: number,
    pageHeight: number,
    hasChinese: boolean,
    opacityMultiplier: number
  ) {
    // 添加极小的水印，几乎不可见但影响整体去除
    const microCount = Math.floor((pageWidth * pageHeight) / 100000)
    
    for (let i = 0; i < microCount; i++) {
      const x = this.rng.next() * pageWidth
      const y = this.rng.next() * pageHeight
      
      const microConfig = {
        ...config,
        fontSize: Math.max(config.fontSize * 0.3, 6), // 极小字体
        rotation: this.rng.next() * 360,
        text: this.generateMicroText(config.text)
      }
      
      const microOpacity = config.opacity * opacityMultiplier * 0.5
      this.drawVariantWatermark(page, microConfig, font, color, x, y, microOpacity, hasChinese)
    }
  }

  private generateWatermarkVariations(config: WatermarkConfig, count: number): WatermarkConfig[] {
    const variations: WatermarkConfig[] = []
    
    for (let i = 0; i < count; i++) {
      variations.push({
        ...config,
        fontSize: config.fontSize * (0.8 + this.rng.next() * 0.4), // 80%-120%大小变化
        rotation: config.rotation + (this.rng.next() - 0.5) * 60, // ±30度随机偏移
        opacity: config.opacity * (0.7 + this.rng.next() * 0.6), // 透明度变化
        text: this.generateTextVariant(config.text, i)
      })
    }
    
    return variations
  }

  private generateTextVariant(originalText: string, index: number): string {
    // 生成文本变体，保持识别度但增加多样性
    const variants = [
      originalText,
      originalText.toUpperCase(),
      originalText.toLowerCase(),
      `${originalText}•`,
      `★${originalText}★`,
      originalText.split('').join(' '), // 字符间加空格
    ]
    
    return variants[index % variants.length]
  }

  private generateNoiseText(originalText: string): string {
    // 生成噪声文本变体
    const noiseChars = ['·', '•', '◦', '▪', '▫', '○', '●']
    const shouldAddNoise = this.rng.next() < 0.3
    
    if (shouldAddNoise) {
      const noise = noiseChars[Math.floor(this.rng.next() * noiseChars.length)]
      return this.rng.next() < 0.5 ? `${noise}${originalText}` : `${originalText}${noise}`
    }
    
    return originalText
  }

  private generateMicroText(originalText: string): string {
    // 生成微观文本（通常是单个字符或符号）
    const microSymbols = ['©', '®', '™', '°', '•', '·']
    return microSymbols[Math.floor(this.rng.next() * microSymbols.length)]
  }

  private createConfusionVariant(config: WatermarkConfig): WatermarkConfig {
    return {
      ...config,
      fontSize: config.fontSize * (0.6 + this.rng.next() * 0.8),
      rotation: this.rng.next() * 360,
      text: this.generateNoiseText(config.text)
    }
  }

  private drawVariantWatermark(
    page: any,
    config: WatermarkConfig,
    font: any,
    color: { r: number; g: number; b: number },
    x: number,
    y: number,
    opacity: number,
    hasChinese: boolean
  ) {
    try {
      const text = hasChinese ? this.createFallbackText(config.text) : config.text
      
      page.drawText(text, {
        x,
        y,
        size: config.fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: Math.max(0.05, Math.min(0.95, opacity)), // 限制透明度范围
        rotate: degrees(config.rotation)
      })
    } catch (error) {
      // 静默失败，不影响其他水印
    }
  }

  static async downloadFile(result: WatermarkResult, filename?: string) {
    const name = filename || `水印_${result.originalFile.name.replace(/\.[^/.]+$/, '')}.pdf`
    saveAs(result.processedBlob, name)
  }

  static detectFileType(file: File): DocumentFile['type'] {
    const extension = file.name.toLowerCase().split('.').pop()
    
    if (extension === 'pdf') return 'pdf'
    if (['doc', 'docx'].includes(extension || '')) return 'word'
    return 'unknown'
  }
}
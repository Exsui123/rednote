export interface WatermarkConfig {
  text: string
  fontSize: number
  opacity: number
  rotation: number
  color: string
  position: WatermarkPosition
  spacing: number
  pattern: WatermarkPattern
  // 高强度防护选项
  securityLevel?: 'basic' | 'enhanced' | 'paranoid'
  randomSeed?: string
  contentAdaptive?: boolean
  multiLayer?: boolean
}

export type WatermarkPosition = 
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'full-page'

export type WatermarkPattern = 
  | 'single'
  | 'repeat'
  | 'grid'
  | 'diagonal'
  | 'paranoid'
  | 'anti-removal'

export interface DocumentFile {
  file: File
  name: string
  type: 'pdf' | 'word' | 'unknown'
  size: number
  preview?: string
}

export interface WatermarkResult {
  originalFile: DocumentFile
  processedBlob: Blob
  downloadUrl: string
  processTime: number
}

export interface WatermarkProgress {
  stage: 'uploading' | 'converting' | 'watermarking' | 'completed' | 'error'
  progress: number
  message: string
}
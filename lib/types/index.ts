export interface Point {
  x: number
  y: number
}

export interface PerspectiveTransform {
  topLeft: Point
  topRight: Point
  bottomLeft: Point
  bottomRight: Point
}

export interface CanvasSize {
  width: number
  height: number
}

export interface ImageFile {
  id: string
  file: File
  url: string
  name: string
}

export interface EditorState {
  backgroundImage: ImageFile | null
  replaceImages: ImageFile[]
  currentReplaceIndex: number
  canvasSize: CanvasSize
  zoom: number
  // 全局共享的变换状态
  sharedTransform?: PerspectiveTransform
}

export interface ExportSettings {
  format: 'png' | 'jpeg' | 'webp'
  quality: number
}
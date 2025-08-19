import { CanvasSize, ImageFile } from "./index"

export type PuzzleLayout = "1+4" | "1+6" | "2+4" | "grid" | "custom"
export type PuzzleDirection = "left-main" | "right-main" | "top-main" | "bottom-main"

export interface ImageItem {
  id: string
  url: string
  name: string
  type?: "main" | "sub"
  isVisible?: boolean
}

export interface PuzzleImageItem extends ImageFile {
  type: "main" | "sub"
  position?: { x: number; y: number }
  size?: { width: number; height: number }
  isVisible?: boolean
}

export interface PptPuzzleState {
  images: PuzzleImageItem[]
  mainImages: PuzzleImageItem[]
  subImages: PuzzleImageItem[]
  layout: PuzzleLayout
  direction: PuzzleDirection // 布局方向
  subPerMain: number // 每个主图配几个次图
  mainPerPage: number // 每页主图数
  subRatio: number // 次图相对于主图的缩放比例
  canvasSize: CanvasSize
  customCanvasSize?: CanvasSize // 自定义尺寸
  zoom: number
  spacing: number
  backgroundColor: string
  showPuzzle: boolean // 控制是否显示拼图
  currentBatchIndex: number // 当前批次索引
  totalBatches: number // 总批次数
}

export interface PuzzleLayoutConfig {
  mainRegions: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
  subRegions: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
}
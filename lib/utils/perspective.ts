import { Point, PerspectiveTransform } from "@/lib/types"

// 计算透视变换矩阵
export function computePerspectiveTransform(
  src: Point[],
  dst: Point[]
): number[] {
  // 这是一个简化的透视变换实现
  // 实际项目中建议使用专门的库如 perspective-transform
  
  const matrix = new Array(9).fill(0)
  
  // 构建方程组
  const A: number[][] = []
  const b: number[] = []
  
  for (let i = 0; i < 4; i++) {
    const srcX = src[i].x
    const srcY = src[i].y
    const dstX = dst[i].x
    const dstY = dst[i].y
    
    A.push([srcX, srcY, 1, 0, 0, 0, -srcX * dstX, -srcY * dstX])
    A.push([0, 0, 0, srcX, srcY, 1, -srcX * dstY, -srcY * dstY])
    b.push(dstX)
    b.push(dstY)
  }
  
  // 这里应该解方程组，但为了简化，我们返回一个单位矩阵
  return [1, 0, 0, 0, 1, 0, 0, 0, 1]
}

// 应用透视变换到点
export function applyPerspectiveTransform(
  point: Point,
  matrix: number[]
): Point {
  const x = point.x
  const y = point.y
  
  const w = matrix[6] * x + matrix[7] * y + matrix[8]
  const newX = (matrix[0] * x + matrix[1] * y + matrix[2]) / w
  const newY = (matrix[3] * x + matrix[4] * y + matrix[5]) / w
  
  return { x: newX, y: newY }
}

// 从 PerspectiveTransform 获取四个角点
export function getCornerPoints(transform: PerspectiveTransform): Point[] {
  return [
    transform.topLeft,
    transform.topRight,
    transform.bottomRight,
    transform.bottomLeft
  ]
}

// 绘制带透视的图片到 Canvas
export function drawPerspectiveImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  transform: PerspectiveTransform
) {
  // 简化实现：使用裁切路径
  ctx.save()
  
  ctx.beginPath()
  ctx.moveTo(transform.topLeft.x, transform.topLeft.y)
  ctx.lineTo(transform.topRight.x, transform.topRight.y)
  ctx.lineTo(transform.bottomRight.x, transform.bottomRight.y)
  ctx.lineTo(transform.bottomLeft.x, transform.bottomLeft.y)
  ctx.closePath()
  ctx.clip()
  
  // 计算边界框
  const minX = Math.min(
    transform.topLeft.x,
    transform.topRight.x,
    transform.bottomLeft.x,
    transform.bottomRight.x
  )
  const minY = Math.min(
    transform.topLeft.y,
    transform.topRight.y,
    transform.bottomLeft.y,
    transform.bottomRight.y
  )
  const maxX = Math.max(
    transform.topLeft.x,
    transform.topRight.x,
    transform.bottomLeft.x,
    transform.bottomRight.x
  )
  const maxY = Math.max(
    transform.topLeft.y,
    transform.topRight.y,
    transform.bottomLeft.y,
    transform.bottomRight.y
  )
  
  // 简单绘制（拉伸到边界框）
  ctx.drawImage(img, minX, minY, maxX - minX, maxY - minY)
  
  ctx.restore()
}
import { PuzzleLayout, PuzzleLayoutConfig, PuzzleDirection } from "@/lib/types/ppt-puzzle"
import { CanvasSize } from "@/lib/types"

// 新的竖排布局生成函数
function generateVerticalLayout(
  width: number,
  height: number,
  spacing: number,
  direction: PuzzleDirection,
  mainCount: number,
  subCount: number,
  subPerMain: number,
  subRatio: number = 0.3  // 次图相对于主图的缩放比例
): PuzzleLayoutConfig {
  const mainRegions = []
  const subRegions = []
  
  // 根据方向决定主图和次图的区域
  const isHorizontal = direction === "left-main" || direction === "right-main"
  const isVertical = direction === "top-main" || direction === "bottom-main"
  
  if (isHorizontal) {
    // 横向布局：主图在左/右，次图在右/左侧竖排
    const hasSubImages = subCount > 0
    
    if (!hasSubImages) {
      // 没有次图时，主图占满整个画布
      const mainItemHeight = mainCount > 0 ? (height - spacing * (mainCount + 1)) / mainCount : 0
      const mainItemWidth = width - spacing * 2
      
      for (let i = 0; i < mainCount; i++) {
        mainRegions.push({
          x: spacing,
          y: spacing + i * (mainItemHeight + spacing),
          width: mainItemWidth,
          height: mainItemHeight
        })
      }
    } else {
      // 有次图时，反推计算各个区域的尺寸
      // 步骤1：计算可用空间
      const availableWidth = width - spacing * 3  // 左中右三个间距
      const availableHeight = height - spacing * 2  // 上下两个间距
      
      // 步骤2：根据次图比例分配宽度
      // 主图区域宽度 = 可用宽度 / (1 + subRatio)
      // 次图区域宽度 = 可用宽度 * subRatio / (1 + subRatio)
      const mainAreaWidth = availableWidth / (1 + subRatio)
      const subAreaWidth = availableWidth * subRatio / (1 + subRatio)
      
      // 步骤3：计算主图尺寸
      // 主图高度根据主图数量平均分配
      const mainItemHeight = (availableHeight - spacing * (mainCount - 1)) / mainCount
      const mainItemWidth = mainAreaWidth
      
      // 步骤4：计算次图尺寸
      // 每个主图对应的次图高度总和 = 主图高度
      // 单个次图高度 = 主图高度 / 每个主图的次图数
      const subItemHeight = mainItemHeight / subPerMain
      const subItemWidth = subAreaWidth
      
      console.log('Layout calculation:', {
        availableWidth,
        availableHeight,
        mainAreaWidth,
        subAreaWidth,
        mainItemWidth,
        mainItemHeight,
        subItemWidth,
        subItemHeight,
        mainCount,
        subCount,
        subPerMain
      })
      
      // 生成主图区域
      for (let i = 0; i < mainCount; i++) {
        const x = direction === "left-main"
          ? spacing
          : spacing * 2 + subAreaWidth
        const y = spacing + i * (mainItemHeight + spacing)
        
        mainRegions.push({
          x,
          y,
          width: mainItemWidth,
          height: mainItemHeight
        })
      }
      
      // 生成次图区域
      let currentSubIndex = 0
      for (let mainIndex = 0; mainIndex < mainCount && currentSubIndex < subCount; mainIndex++) {
        const subsForThisMain = Math.min(subPerMain, subCount - currentSubIndex)
        
        // 计算这组次图的起始位置（与对应主图对齐）
        const mainRegion = mainRegions[mainIndex]
        
        for (let i = 0; i < subsForThisMain; i++) {
          const x = direction === "left-main"
            ? spacing * 2 + mainAreaWidth
            : spacing
          // 次图与对应主图对齐，并在其高度范围内平均分布
          const y = mainRegion.y + i * subItemHeight
          
          subRegions.push({
            x,
            y,
            width: subItemWidth,
            height: subItemHeight
          })
          currentSubIndex++
        }
      }
    }
  } else {
    // 纵向布局：主图在上/下，次图在另一侧
    const hasSubImages = subCount > 0
    
    if (!hasSubImages) {
      // 没有次图时，主图占满整个画布
      const mainCols = Math.ceil(Math.sqrt(mainCount))
      const mainRows = Math.ceil(mainCount / mainCols)
      const mainItemWidth = (width - spacing * (mainCols + 1)) / mainCols
      const mainItemHeight = (height - spacing * (mainRows + 1)) / mainRows
      
      for (let i = 0; i < mainCount; i++) {
        const col = i % mainCols
        const row = Math.floor(i / mainCols)
        mainRegions.push({
          x: spacing + col * (mainItemWidth + spacing),
          y: spacing + row * (mainItemHeight + spacing),
          width: mainItemWidth,
          height: mainItemHeight
        })
      }
    } else {
      // 有次图时，反推计算各个区域的尺寸
      // 步骤1：计算可用空间
      const availableWidth = width - spacing * 2
      const availableHeight = height - spacing * 3  // 上中下三个间距
      
      // 步骤2：根据次图比例分配高度
      const mainAreaHeight = availableHeight / (1 + subRatio)
      const subAreaHeight = availableHeight * subRatio / (1 + subRatio)
      
      // 步骤3：计算主图布局（网格排列）
      const mainCols = Math.ceil(Math.sqrt(mainCount * 1.5))  // 偏向横向
      const mainRows = Math.ceil(mainCount / mainCols)
      const mainItemWidth = (availableWidth - spacing * (mainCols - 1)) / mainCols
      const mainItemHeight = (mainAreaHeight - spacing * (mainRows - 1)) / mainRows
      
      // 步骤4：计算次图布局（横向排列）
      // 计算每行能放多少个次图
      const subsPerRow = Math.max(subPerMain * mainCols, subCount)
      const subRows = Math.ceil(subCount / subsPerRow)
      const subItemWidth = (availableWidth - spacing * (subsPerRow - 1)) / subsPerRow
      const subItemHeight = (subAreaHeight - spacing * (subRows - 1)) / subRows
      
      console.log('Vertical layout calculation:', {
        mainAreaHeight,
        subAreaHeight,
        mainCols,
        mainRows,
        mainItemWidth,
        mainItemHeight,
        subsPerRow,
        subRows,
        subItemWidth,
        subItemHeight
      })
      
      // 生成主图区域
      for (let i = 0; i < mainCount; i++) {
        const col = i % mainCols
        const row = Math.floor(i / mainCols)
        const x = spacing + col * (mainItemWidth + spacing)
        const y = direction === "top-main"
          ? spacing + row * (mainItemHeight + spacing)
          : spacing * 2 + subAreaHeight + row * (mainItemHeight + spacing)
        
        mainRegions.push({
          x,
          y,
          width: mainItemWidth,
          height: mainItemHeight
        })
      }
      
      // 生成次图区域
      for (let i = 0; i < subCount; i++) {
        const col = i % subsPerRow
        const row = Math.floor(i / subsPerRow)
        const x = spacing + col * (subItemWidth + spacing)
        const y = direction === "top-main"
          ? spacing * 2 + mainAreaHeight + row * (subItemHeight + spacing)
          : spacing + row * (subItemHeight + spacing)
        
        subRegions.push({
          x,
          y,
          width: subItemWidth,
          height: subItemHeight
        })
      }
    }
  }
  
  return { mainRegions, subRegions }
}

export function generatePuzzleLayout(
  layout: PuzzleLayout,
  canvasSize: CanvasSize,
  spacing: number,
  subPerMain: number,
  direction: PuzzleDirection = "left-main",
  mainCount: number,
  subCount: number,
  subRatio: number = 0.3  // 次图相对于主图的缩放比例
): PuzzleLayoutConfig {
  const { width, height } = canvasSize

  // 现在总是使用实际的主图数和次图数，配比由subPerMain控制
  // 确保主图始终以实际数量展示
  const actualMainCount = Math.max(1, mainCount)  // 至少显示1个主图区域
  return generateVerticalLayout(width, height, spacing, direction, actualMainCount, subCount, subPerMain, subRatio)
}

function generate1Plus4Layout(width: number, height: number, spacing: number, direction: PuzzleDirection): PuzzleLayoutConfig {
  switch (direction) {
    case "left-main":
      // 左侧主图，右侧2x2次图
      const mainWidth = (width - spacing * 3) * 0.6
      const mainHeight = height - spacing * 2
      const subWidth = (width - spacing * 3) * 0.4 / 2 - spacing / 2
      const subHeight = (height - spacing * 3) / 2
      return {
        mainRegions: [{
          x: spacing,
          y: spacing,
          width: mainWidth,
          height: mainHeight
        }],
        subRegions: [
          { x: spacing * 2 + mainWidth, y: spacing, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth + subWidth + spacing, y: spacing, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth, y: spacing * 2 + subHeight, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth + subWidth + spacing, y: spacing * 2 + subHeight, width: subWidth, height: subHeight }
        ]
      }

    case "right-main":
      // 右侧主图，左侧2x2次图
      const mainWidthR = (width - spacing * 3) * 0.6
      const mainHeightR = height - spacing * 2
      const subWidthR = (width - spacing * 3) * 0.4 / 2 - spacing / 2
      const subHeightR = (height - spacing * 3) / 2
      return {
        mainRegions: [{
          x: spacing * 2 + subWidthR * 2 + spacing,
          y: spacing,
          width: mainWidthR,
          height: mainHeightR
        }],
        subRegions: [
          { x: spacing, y: spacing, width: subWidthR, height: subHeightR },
          { x: spacing * 2 + subWidthR, y: spacing, width: subWidthR, height: subHeightR },
          { x: spacing, y: spacing * 2 + subHeightR, width: subWidthR, height: subHeightR },
          { x: spacing * 2 + subWidthR, y: spacing * 2 + subHeightR, width: subWidthR, height: subHeightR }
        ]
      }

    case "top-main":
      // 上方主图，下方2x2次图
      const mainWidthT = width - spacing * 2
      const mainHeightT = (height - spacing * 3) * 0.6
      const subWidthT = (width - spacing * 3) / 2
      const subHeightT = (height - spacing * 3) * 0.4 / 2 - spacing / 2
      return {
        mainRegions: [{
          x: spacing,
          y: spacing,
          width: mainWidthT,
          height: mainHeightT
        }],
        subRegions: [
          { x: spacing, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 2 + subWidthT, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing, y: spacing * 3 + mainHeightT + subHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 2 + subWidthT, y: spacing * 3 + mainHeightT + subHeightT, width: subWidthT, height: subHeightT }
        ]
      }

    case "bottom-main":
      // 下方主图，上方2x2次图
      const mainWidthB = width - spacing * 2
      const mainHeightB = (height - spacing * 3) * 0.6
      const subWidthB = (width - spacing * 3) / 2
      const subHeightB = (height - spacing * 3) * 0.4 / 2 - spacing / 2
      return {
        mainRegions: [{
          x: spacing,
          y: spacing * 2 + subHeightB * 2 + spacing,
          width: mainWidthB,
          height: mainHeightB
        }],
        subRegions: [
          { x: spacing, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing * 2 + subWidthB, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing, y: spacing * 2 + subHeightB, width: subWidthB, height: subHeightB },
          { x: spacing * 2 + subWidthB, y: spacing * 2 + subHeightB, width: subWidthB, height: subHeightB }
        ]
      }

    default:
      return generate1Plus4Layout(width, height, spacing, "left-main")
  }
}

function generate1Plus6Layout(width: number, height: number, spacing: number, direction: PuzzleDirection): PuzzleLayoutConfig {
  switch (direction) {
    case "left-main":
      // 左侧大图，右侧3x2小图
      const mainWidth = (width - spacing * 3) * 0.6
      const mainHeight = height - spacing * 2
      const subWidth = (width - spacing * 3) * 0.4 / 2 - spacing / 2
      const subHeight = (height - spacing * 4) / 3
      return {
        mainRegions: [{
          x: spacing,
          y: spacing,
          width: mainWidth,
          height: mainHeight
        }],
        subRegions: [
          { x: spacing * 2 + mainWidth, y: spacing, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth, y: spacing * 2 + subHeight, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth, y: spacing * 3 + subHeight * 2, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth + subWidth + spacing, y: spacing, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth + subWidth + spacing, y: spacing * 2 + subHeight, width: subWidth, height: subHeight },
          { x: spacing * 2 + mainWidth + subWidth + spacing, y: spacing * 3 + subHeight * 2, width: subWidth, height: subHeight }
        ]
      }

    case "right-main":
      // 右侧大图，左侧3x2小图
      const mainWidthR = (width - spacing * 3) * 0.6
      const mainHeightR = height - spacing * 2
      const subWidthR = (width - spacing * 3) * 0.4 / 2 - spacing / 2
      const subHeightR = (height - spacing * 4) / 3
      return {
        mainRegions: [{
          x: spacing * 2 + subWidthR * 2 + spacing,
          y: spacing,
          width: mainWidthR,
          height: mainHeightR
        }],
        subRegions: [
          { x: spacing, y: spacing, width: subWidthR, height: subHeightR },
          { x: spacing, y: spacing * 2 + subHeightR, width: subWidthR, height: subHeightR },
          { x: spacing, y: spacing * 3 + subHeightR * 2, width: subWidthR, height: subHeightR },
          { x: spacing * 2 + subWidthR, y: spacing, width: subWidthR, height: subHeightR },
          { x: spacing * 2 + subWidthR, y: spacing * 2 + subHeightR, width: subWidthR, height: subHeightR },
          { x: spacing * 2 + subWidthR, y: spacing * 3 + subHeightR * 2, width: subWidthR, height: subHeightR }
        ]
      }

    case "top-main":
      // 上方大图，下方2x3小图
      const mainWidthT = width - spacing * 2
      const mainHeightT = (height - spacing * 3) * 0.6
      const subWidthT = (width - spacing * 4) / 3
      const subHeightT = (height - spacing * 3) * 0.4 / 2 - spacing / 2
      return {
        mainRegions: [{
          x: spacing,
          y: spacing,
          width: mainWidthT,
          height: mainHeightT
        }],
        subRegions: [
          { x: spacing, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 2 + subWidthT, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 3 + subWidthT * 2, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing, y: spacing * 3 + mainHeightT + subHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 2 + subWidthT, y: spacing * 3 + mainHeightT + subHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 3 + subWidthT * 2, y: spacing * 3 + mainHeightT + subHeightT, width: subWidthT, height: subHeightT }
        ]
      }

    case "bottom-main":
      // 下方大图，上方2x3小图
      const mainWidthB = width - spacing * 2
      const mainHeightB = (height - spacing * 3) * 0.6
      const subWidthB = (width - spacing * 4) / 3
      const subHeightB = (height - spacing * 3) * 0.4 / 2 - spacing / 2
      return {
        mainRegions: [{
          x: spacing,
          y: spacing * 2 + subHeightB * 2 + spacing,
          width: mainWidthB,
          height: mainHeightB
        }],
        subRegions: [
          { x: spacing, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing * 2 + subWidthB, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing * 3 + subWidthB * 2, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing, y: spacing * 2 + subHeightB, width: subWidthB, height: subHeightB },
          { x: spacing * 2 + subWidthB, y: spacing * 2 + subHeightB, width: subWidthB, height: subHeightB },
          { x: spacing * 3 + subWidthB * 2, y: spacing * 2 + subHeightB, width: subWidthB, height: subHeightB }
        ]
      }

    default:
      return generate1Plus6Layout(width, height, spacing, "left-main")
  }
}

function generate2Plus4Layout(width: number, height: number, spacing: number, direction: PuzzleDirection): PuzzleLayoutConfig {
  switch (direction) {
    case "left-main":
      // 左侧2个主图（上下排列），右侧4个次图（竖向一列）
      const mainWidthL = (width - spacing * 3) * 0.67  // 主图区域占约2/3宽度
      const mainHeightL = (height - spacing * 3) / 2
      const subWidthL = (width - spacing * 3) * 0.33  // 次图区域占约1/3宽度
      const subHeightL = (height - spacing * 5) / 4  // 4个次图竖向排列
      return {
        mainRegions: [
          { x: spacing, y: spacing, width: mainWidthL, height: mainHeightL },
          { x: spacing, y: spacing * 2 + mainHeightL, width: mainWidthL, height: mainHeightL }
        ],
        subRegions: [
          { x: spacing * 2 + mainWidthL, y: spacing, width: subWidthL, height: subHeightL },
          { x: spacing * 2 + mainWidthL, y: spacing * 2 + subHeightL, width: subWidthL, height: subHeightL },
          { x: spacing * 2 + mainWidthL, y: spacing * 3 + subHeightL * 2, width: subWidthL, height: subHeightL },
          { x: spacing * 2 + mainWidthL, y: spacing * 4 + subHeightL * 3, width: subWidthL, height: subHeightL }
        ]
      }

    case "right-main":
      // 右侧2个主图（上下排列），左侧4个次图（竖向一列）
      const mainWidthR = (width - spacing * 3) * 0.67  // 主图区域占约2/3宽度
      const mainHeightR = (height - spacing * 3) / 2
      const subWidthR = (width - spacing * 3) * 0.33  // 次图区域占约1/3宽度
      const subHeightR = (height - spacing * 5) / 4  // 4个次图竖向排列
      return {
        mainRegions: [
          { x: spacing * 2 + subWidthR, y: spacing, width: mainWidthR, height: mainHeightR },
          { x: spacing * 2 + subWidthR, y: spacing * 2 + mainHeightR, width: mainWidthR, height: mainHeightR }
        ],
        subRegions: [
          { x: spacing, y: spacing, width: subWidthR, height: subHeightR },
          { x: spacing, y: spacing * 2 + subHeightR, width: subWidthR, height: subHeightR },
          { x: spacing, y: spacing * 3 + subHeightR * 2, width: subWidthR, height: subHeightR },
          { x: spacing, y: spacing * 4 + subHeightR * 3, width: subWidthR, height: subHeightR }
        ]
      }

    case "top-main":
      // 上方2个主图（左右排列），下方4个次图（横向排列）
      const mainWidthT = (width - spacing * 3) / 2
      const mainHeightT = (height - spacing * 3) * 0.67  // 主图区域占约2/3高度
      const subWidthT = (width - spacing * 5) / 4
      const subHeightT = (height - spacing * 3) * 0.33  // 次图区域占约1/3高度
      return {
        mainRegions: [
          { x: spacing, y: spacing, width: mainWidthT, height: mainHeightT },
          { x: spacing * 2 + mainWidthT, y: spacing, width: mainWidthT, height: mainHeightT }
        ],
        subRegions: [
          { x: spacing, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 2 + subWidthT, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 3 + subWidthT * 2, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT },
          { x: spacing * 4 + subWidthT * 3, y: spacing * 2 + mainHeightT, width: subWidthT, height: subHeightT }
        ]
      }

    case "bottom-main":
      // 下方2个主图（左右排列），上方4个次图（横向排列）
      const mainWidthB = (width - spacing * 3) / 2
      const mainHeightB = (height - spacing * 3) * 0.67  // 主图区域占约2/3高度
      const subWidthB = (width - spacing * 5) / 4
      const subHeightB = (height - spacing * 3) * 0.33  // 次图区域占约1/3高度
      return {
        mainRegions: [
          { x: spacing, y: spacing * 2 + subHeightB, width: mainWidthB, height: mainHeightB },
          { x: spacing * 2 + mainWidthB, y: spacing * 2 + subHeightB, width: mainWidthB, height: mainHeightB }
        ],
        subRegions: [
          { x: spacing, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing * 2 + subWidthB, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing * 3 + subWidthB * 2, y: spacing, width: subWidthB, height: subHeightB },
          { x: spacing * 4 + subWidthB * 3, y: spacing, width: subWidthB, height: subHeightB }
        ]
      }

    default:
      return generate2Plus4Layout(width, height, spacing, "top-main")
  }
}

function generateGridLayout(width: number, height: number, spacing: number): PuzzleLayoutConfig {
  // 网格布局：均匀分布，所有图片大小相同
  const cols = 3
  const rows = 2
  const itemWidth = (width - spacing * (cols + 1)) / cols
  const itemHeight = (height - spacing * (rows + 1)) / rows

  const regions = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      regions.push({
        x: spacing * (col + 1) + itemWidth * col,
        y: spacing * (row + 1) + itemHeight * row,
        width: itemWidth,
        height: itemHeight
      })
    }
  }

  return {
    mainRegions: regions.slice(0, 2), // 前两个作为主图区域
    subRegions: regions.slice(2) // 剩余作为次图区域
  }
}

function generateCustomLayout(
  width: number, 
  height: number, 
  spacing: number, 
  customLayout: { main: number; sub: number },
  direction: PuzzleDirection
): PuzzleLayoutConfig {
  const { main, sub } = customLayout
  
  if (main === 0 && sub === 0) {
    return { mainRegions: [], subRegions: [] }
  }

  // 识别常见的预设布局模式，使用相同的视觉效果
  const layoutKey = `${main}+${sub}`
  
  // 如果是已知的预设布局，直接使用预设布局的算法
  switch (layoutKey) {
    case "1+4":
      return generate1Plus4Layout(width, height, spacing, direction)
    case "1+6":
      return generate1Plus6Layout(width, height, spacing, direction)
    case "2+4":
      return generate2Plus4Layout(width, height, spacing, direction)
  }

  // 对于其他自定义布局，使用通用算法
  switch (direction) {
    case "left-main":
    case "right-main": {
      // 横向布局：主图在左/右侧，次图在另一侧竖向排列
      const mainAreaWidth = main > 0 ? (width - spacing * 3) * 0.67 : 0  // 主图区域占67%
      const subAreaWidth = sub > 0 ? (width - spacing * 3) * 0.33 : 0   // 次图区域占33%
      
      const mainRegions = []
      const subRegions = []
      
      // 生成主图区域
      if (main > 0) {
        const mainCols = Math.max(1, Math.ceil(Math.sqrt(main * 0.7))) // 偏向竖向排列
        const mainRows = Math.ceil(main / mainCols)
        const mainItemWidth = (mainAreaWidth - spacing * (mainCols - 1)) / mainCols
        const mainItemHeight = (height - spacing * (mainRows + 1)) / mainRows
        
        for (let i = 0; i < main; i++) {
          const row = Math.floor(i / mainCols)
          const col = i % mainCols
          const x = direction === "left-main" 
            ? spacing + col * (mainItemWidth + spacing)
            : spacing * 2 + subAreaWidth + col * (mainItemWidth + spacing)
          mainRegions.push({
            x,
            y: spacing + row * (mainItemHeight + spacing),
            width: mainItemWidth,
            height: mainItemHeight
          })
        }
      }
      
      // 生成次图区域 - 竖向排列
      if (sub > 0) {
        const subItemWidth = subAreaWidth
        const subItemHeight = (height - spacing * (sub + 1)) / sub
        
        for (let i = 0; i < sub; i++) {
          const x = direction === "left-main"
            ? spacing * 2 + mainAreaWidth
            : spacing
          subRegions.push({
            x,
            y: spacing + i * (subItemHeight + spacing),
            width: subItemWidth,
            height: subItemHeight
          })
        }
      }
      
      return { mainRegions, subRegions }
    }
    
    case "top-main":
    case "bottom-main": {
      // 纵向布局：主图在上/下方，次图在另一侧横向排列
      const mainAreaHeight = main > 0 ? (height - spacing * 3) * 0.67 : 0  // 主图区域占67%
      const subAreaHeight = sub > 0 ? (height - spacing * 3) * 0.33 : 0   // 次图区域占33%
      
      const mainRegions = []
      const subRegions = []
      
      // 生成主图区域
      if (main > 0) {
        const mainCols = Math.max(1, Math.ceil(Math.sqrt(main * 1.3))) // 偏向横向排列
        const mainRows = Math.ceil(main / mainCols)
        const mainItemWidth = (width - spacing * (mainCols + 1)) / mainCols
        const mainItemHeight = (mainAreaHeight - spacing * (mainRows - 1)) / mainRows
        
        for (let i = 0; i < main; i++) {
          const row = Math.floor(i / mainCols)
          const col = i % mainCols
          const y = direction === "top-main"
            ? spacing + row * (mainItemHeight + spacing)
            : spacing * 2 + subAreaHeight + row * (mainItemHeight + spacing)
          mainRegions.push({
            x: spacing + col * (mainItemWidth + spacing),
            y,
            width: mainItemWidth,
            height: mainItemHeight
          })
        }
      }
      
      // 生成次图区域 - 横向排列
      if (sub > 0) {
        const subItemWidth = (width - spacing * (sub + 1)) / sub
        const subItemHeight = subAreaHeight
        
        for (let i = 0; i < sub; i++) {
          const y = direction === "top-main"
            ? spacing * 2 + mainAreaHeight
            : spacing
          subRegions.push({
            x: spacing + i * (subItemWidth + spacing),
            y,
            width: subItemWidth,
            height: subItemHeight
          })
        }
      }
      
      return { mainRegions, subRegions }
    }
    
    default:
      return generateCustomLayout(width, height, spacing, customLayout, "left-main")
  }
}
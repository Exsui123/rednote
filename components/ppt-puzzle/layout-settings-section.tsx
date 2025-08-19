"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PptPuzzleState, PuzzleLayout, PuzzleDirection } from "@/lib/types/ppt-puzzle"
import { Grid3X3, Layout, Palette, Play, Settings } from "lucide-react"

interface LayoutSettingsSectionProps {
  puzzleState: PptPuzzleState
  onStateChange: (state: PptPuzzleState) => void
}


const backgroundColors = [
  { value: "#ffffff", label: "白色" },
  { value: "#f8f9fa", label: "浅灰" },
  { value: "#000000", label: "黑色" },
  { value: "#f3f4f6", label: "灰白" },
  { value: "#dbeafe", label: "浅蓝" },
  { value: "#dcfce7", label: "浅绿" },
  { value: "#fef3c7", label: "浅黄" }
]

const directionOptions: Array<{ value: PuzzleDirection; label: string; description: string }> = [
  { value: "left-main", label: "左主右次", description: "主图在左侧，次图在右侧" },
  { value: "right-main", label: "右主左次", description: "主图在右侧，次图在左侧" },
  { value: "top-main", label: "上主下次", description: "主图在上方，次图在下方" },
  { value: "bottom-main", label: "下主上次", description: "主图在下方，次图在上方" }
]

export function LayoutSettingsSection({ puzzleState, onStateChange }: LayoutSettingsSectionProps) {

  const updateDirection = (direction: PuzzleDirection) => {
    console.log('Updating direction to:', direction)
    onStateChange({
      ...puzzleState,
      direction,
      showPuzzle: puzzleState.showPuzzle  // 保持当前显示状态，如果已生成则立即更新
    })
  }

  const updateSpacing = (spacing: number[]) => {
    onStateChange({
      ...puzzleState,
      spacing: spacing[0]
    })
  }

  const updateBackgroundColor = (backgroundColor: string) => {
    onStateChange({
      ...puzzleState,
      backgroundColor
    })
  }

  const updateZoom = (zoom: number[]) => {
    onStateChange({
      ...puzzleState,
      zoom: zoom[0]
    })
  }

  const updateCanvasSize = (width: number, height: number) => {
    onStateChange({
      ...puzzleState,
      canvasSize: { width, height },
      customCanvasSize: undefined,
      showPuzzle: false  // 重置预览状态
    })
  }

  const updateCustomCanvasSize = (width: number, height: number) => {
    onStateChange({
      ...puzzleState,
      customCanvasSize: { width, height },
      canvasSize: { width, height },
      showPuzzle: false  // 重置预览状态
    })
  }

  const updateSubPerMain = (subPerMain: number) => {
    const newTotalBatches = Math.ceil(puzzleState.mainImages.length / puzzleState.mainPerPage) || 1
    
    onStateChange({
      ...puzzleState,
      subPerMain,
      totalBatches: puzzleState.showPuzzle ? newTotalBatches : puzzleState.totalBatches,
      currentBatchIndex: Math.min(puzzleState.currentBatchIndex, newTotalBatches - 1)
    })
  }

  const updateSubRatio = (ratio: number[]) => {
    onStateChange({
      ...puzzleState,
      subRatio: ratio[0]
    })
  }

  const generatePuzzle = () => {
    // 计算总批次数
    const totalBatches = Math.ceil(puzzleState.mainImages.length / puzzleState.mainPerPage) || 1
    
    onStateChange({
      ...puzzleState,
      showPuzzle: true,
      currentBatchIndex: 0,  // 重置到第一页
      totalBatches: totalBatches
    })
  }

  const getCurrentCanvasSize = () => {
    return puzzleState.customCanvasSize || puzzleState.canvasSize
  }

  return (
    <div className="space-y-6">

      {/* 布局方向 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          <Label className="text-sm font-medium">布局方向</Label>
        </div>
        <Select value={puzzleState.direction} onValueChange={(value) => updateDirection(value as PuzzleDirection)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {directionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 每页主图数设置 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" />
          <Label className="text-sm font-medium">每页主图数</Label>
        </div>
        <Card className="p-4 border-dashed">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">每页显示多少个主图</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={puzzleState.mainPerPage}
                onChange={(e) => {
                  const newMainPerPage = parseInt(e.target.value) || 4
                  const newTotalBatches = Math.ceil(puzzleState.mainImages.length / newMainPerPage) || 1
                  
                  onStateChange({
                    ...puzzleState,
                    mainPerPage: newMainPerPage,
                    totalBatches: puzzleState.showPuzzle ? newTotalBatches : puzzleState.totalBatches,
                    currentBatchIndex: Math.min(puzzleState.currentBatchIndex, newTotalBatches - 1)
                  })
                }}
                className="mt-1"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              示例：输入 4 表示每页显示 4 个主图
            </div>
            
            {puzzleState.mainImages.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                当前配置：{puzzleState.mainImages.length} 个主图
                <br />
                将生成 {Math.ceil(puzzleState.mainImages.length / puzzleState.mainPerPage)} 页拼图
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 次图数量设置 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <Label className="text-sm font-medium">次图配比</Label>
        </div>
        <Card className="p-4 border-dashed">
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">每个主图配几个次图</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={puzzleState.subPerMain}
                onChange={(e) => updateSubPerMain(parseInt(e.target.value) || 2)}
                className="mt-1"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              示例：输入 4 表示一个主图配 4 个次图
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground">次图大小比例</Label>
                <span className="text-xs text-muted-foreground">{Math.round(puzzleState.subRatio * 100)}%</span>
              </div>
              <Slider
                value={[puzzleState.subRatio]}
                onValueChange={updateSubRatio}
                max={1}
                min={0.1}
                step={0.05}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground mt-1">
                次图相对于主图的大小比例
              </div>
            </div>
            
            {puzzleState.mainImages.length > 0 && puzzleState.subImages.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                当前配置：{puzzleState.mainImages.length} 个主图，{puzzleState.subImages.length} 个次图
                <br />
                {(() => {
                  const totalNeeded = puzzleState.mainImages.length * puzzleState.subPerMain
                  const actualSubs = Math.min(totalNeeded, puzzleState.subImages.length)
                  const mainWithSubs = Math.ceil(actualSubs / puzzleState.subPerMain)
                  return `前 ${mainWithSubs} 个主图将配有次图`
                })()}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 分页控件 - 只在多页时显示 */}
      {puzzleState.totalBatches > 1 && puzzleState.showPuzzle && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            <Label className="text-sm font-medium">页面切换</Label>
          </div>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStateChange({
                  ...puzzleState,
                  currentBatchIndex: Math.max(0, puzzleState.currentBatchIndex - 1)
                })}
                disabled={puzzleState.currentBatchIndex === 0}
              >
                上一页
              </Button>
              <span className="text-sm font-medium">
                第 {puzzleState.currentBatchIndex + 1} / {puzzleState.totalBatches} 页
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStateChange({
                  ...puzzleState,
                  currentBatchIndex: Math.min(puzzleState.totalBatches - 1, puzzleState.currentBatchIndex + 1)
                })}
                disabled={puzzleState.currentBatchIndex === puzzleState.totalBatches - 1}
              >
                下一页
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 画布尺寸 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">画布尺寸</Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { width: 1242, height: 1656, label: "3:4" },
            { width: 1080, height: 1080, label: "1:1" },
            { width: 1200, height: 800, label: "3:2" }
          ].map((size) => (
            <Button
              key={size.label}
              variant={
                puzzleState.canvasSize.width === size.width && 
                puzzleState.canvasSize.height === size.height && 
                !puzzleState.customCanvasSize
                  ? "default" 
                  : "outline"
              }
              size="sm"
              onClick={() => updateCanvasSize(size.width, size.height)}
            >
              {size.label}
            </Button>
          ))}
          <Button
            variant={puzzleState.customCanvasSize ? "default" : "outline"}
            size="sm"
            onClick={() => updateCustomCanvasSize(1242, 1656)}
            className="text-xs"
          >
            自定义
          </Button>
        </div>

        {/* 自定义尺寸输入 */}
        {(puzzleState.customCanvasSize || puzzleState.canvasSize.width === 0) && (
          <Card className="p-3 border-dashed">
            <div className="space-y-3">
              <Label className="text-xs font-medium">自定义尺寸 (px)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">宽度</Label>
                  <Input
                    type="number"
                    min="100"
                    max="5000"
                    placeholder="1242"
                    value={getCurrentCanvasSize().width || ''}
                    onChange={(e) => updateCustomCanvasSize(
                      parseInt(e.target.value) || 1242,
                      getCurrentCanvasSize().height || 1656
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">高度</Label>
                  <Input
                    type="number"
                    min="100"
                    max="5000"
                    placeholder="1656"
                    value={getCurrentCanvasSize().height || ''}
                    onChange={(e) => updateCustomCanvasSize(
                      getCurrentCanvasSize().width || 1242,
                      parseInt(e.target.value) || 1656
                    )}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          当前: {getCurrentCanvasSize().width} × {getCurrentCanvasSize().height}
          {puzzleState.customCanvasSize && <span className="text-orange-600 ml-1">(自定义)</span>}
        </div>
      </div>

      {/* 间距设置 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">图片间距</Label>
          <span className="text-xs text-muted-foreground">{puzzleState.spacing}px</span>
        </div>
        <Slider
          value={[puzzleState.spacing]}
          onValueChange={updateSpacing}
          max={50}
          min={0}
          step={5}
          className="w-full"
        />
      </div>

      {/* 背景颜色 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <Label className="text-sm font-medium">背景颜色</Label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {backgroundColors.map((color) => (
            <Button
              key={color.value}
              variant="outline"
              size="sm"
              onClick={() => updateBackgroundColor(color.value)}
              className="h-8 p-0 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 w-full h-full"
                style={{ backgroundColor: color.value }}
              />
              {puzzleState.backgroundColor === color.value && (
                <div className="relative z-10 text-xs font-medium text-black mix-blend-difference">
                  ✓
                </div>
              )}
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          当前颜色: {puzzleState.backgroundColor}
        </div>
      </div>

      {/* 缩放设置 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">画布缩放</Label>
          <span className="text-xs text-muted-foreground">{Math.round(puzzleState.zoom * 100)}%</span>
        </div>
        <Slider
          value={[puzzleState.zoom]}
          onValueChange={updateZoom}
          max={2}
          min={0.2}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* 生成拼图按钮 */}
      <Card className="p-4 border-2 border-dashed border-primary/20">
        <Button 
          className="w-full h-12 text-base font-medium"
          onClick={generatePuzzle}
          disabled={puzzleState.images.length === 0}
        >
          <Play className="h-5 w-5 mr-2" />
          生成拼图预览
        </Button>
        {puzzleState.images.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            请先上传图片
          </p>
        )}
      </Card>

      {/* 预览卡片 */}
      <Card className="p-4 bg-muted/50">
        <div className="text-sm font-medium mb-2">当前配置</div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>次图配比: 每个主图配 {puzzleState.subPerMain} 个次图</div>
          <div>次图大小: 主图的 {Math.round(puzzleState.subRatio * 100)}%</div>
          <div>方向: {directionOptions.find(d => d.value === puzzleState.direction)?.label}</div>
          <div>尺寸: {getCurrentCanvasSize().width} × {getCurrentCanvasSize().height}
            {puzzleState.customCanvasSize && <span className="text-orange-600"> (自定义)</span>}
          </div>
          <div>间距: {puzzleState.spacing}px</div>
          <div>缩放: {Math.round(puzzleState.zoom * 100)}%</div>
          <div>状态: {puzzleState.showPuzzle ? 
            <span className="text-green-600">已生成</span> : 
            <span className="text-muted-foreground">未生成</span>
          }</div>
        </div>
      </Card>
    </div>
  )
}
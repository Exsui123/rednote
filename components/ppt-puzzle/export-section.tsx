"use client"

import { useState } from "react"
import { PptPuzzleState } from "@/lib/types/ppt-puzzle"
import { ExportSettings } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Download, Image as ImageIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { exportPuzzleImage } from "@/lib/utils/puzzle-exporter"
import { exportBatchPuzzleImages } from "@/lib/utils/batch-exporter"

interface ExportSectionProps {
  puzzleState: PptPuzzleState
}

export function ExportSection({ puzzleState }: ExportSectionProps) {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 0.9
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (puzzleState.images.length === 0) {
      alert("请先上传图片")
      return
    }

    if (puzzleState.mainImages.length === 0 && puzzleState.subImages.length === 0) {
      alert("请先设置图片分类")
      return
    }

    setIsExporting(true)
    try {
      // 使用批量导出功能（会自动判断单图还是多图）
      await exportBatchPuzzleImages(puzzleState, exportSettings)
      if (puzzleState.totalBatches > 1) {
        alert(`成功导出 ${puzzleState.totalBatches} 张拼图！`)
      } else {
        alert("拼图导出成功！")
      }
    } catch (error) {
      console.error("导出失败:", error)
      alert("导出失败，请重试")
    } finally {
      setIsExporting(false)
    }
  }

  const canExport = puzzleState.images.length > 0 && 
    (puzzleState.mainImages.length > 0 || puzzleState.subImages.length > 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">导出设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>格式</Label>
            <Select 
              value={exportSettings.format}
              onValueChange={(value: 'png' | 'jpeg' | 'webp') => 
                setExportSettings({ ...exportSettings, format: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportSettings.format !== 'png' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>质量</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(exportSettings.quality * 100)}%
                </span>
              </div>
              <Slider
                value={[exportSettings.quality]}
                onValueChange={(value) => 
                  setExportSettings({ ...exportSettings, quality: value[0] })
                }
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 导出预览信息 */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">画布尺寸:</span>
              <span>{puzzleState.canvasSize.width} × {puzzleState.canvasSize.height}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">布局模式:</span>
              <span>{puzzleState.layout}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">主图数量:</span>
              <span className="text-orange-600">{puzzleState.mainImages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">次图数量:</span>
              <span className="text-blue-600">{puzzleState.subImages.length}</span>
            </div>
            {puzzleState.totalBatches > 1 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">当前页:</span>
                <span className="text-green-600">{puzzleState.currentBatchIndex + 1} / {puzzleState.totalBatches}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button 
        className="w-full" 
        onClick={handleExport}
        disabled={isExporting || !canExport}
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting 
          ? "导出中..." 
          : puzzleState.totalBatches > 1 
            ? `导出 ${puzzleState.totalBatches} 张拼图 (ZIP)`
            : "导出拼图"
        }
      </Button>

      {!canExport && puzzleState.images.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <ImageIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">请先上传图片</p>
        </div>
      )}

      {puzzleState.images.length > 0 && puzzleState.mainImages.length === 0 && puzzleState.subImages.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">请先设置图片分类</p>
        </div>
      )}
    </div>
  )
}
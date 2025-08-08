"use client"

import { useState } from "react"
import { EditorState, ExportSettings } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Download } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { batchProcess, downloadAll } from "@/lib/utils/batch-processor"

interface ExportSectionProps {
  editorState: EditorState
}

export function ExportSection({ editorState }: ExportSectionProps) {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 0.9
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const handleExport = async () => {
    if (!editorState.backgroundImage || editorState.replaceImages.length === 0) {
      alert("请先上传背景图和替换图片")
      return
    }

    // Check if shared transform is set
    if (!editorState.sharedTransform) {
      alert("请先调整替换图片的位置")
      return
    }

    setIsExporting(true)
    setExportProgress(0)
    try {
      const results = await batchProcess(
        editorState,
        exportSettings,
        (current, total) => {
          setExportProgress(Math.round((current / total) * 100))
        }
      )
      
      await downloadAll(results)
      alert(`成功导出 ${results.length} 张图片！`)
    } catch (error) {
      console.error("导出失败:", error)
      alert("导出失败，请重试")
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

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

      <Button 
        className="w-full" 
        onClick={handleExport}
        disabled={isExporting || !editorState.backgroundImage || editorState.replaceImages.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? `导出中... (${exportProgress}%)` : `导出全部 (${editorState.replaceImages.length} 张)`}
      </Button>

      {isExporting && (
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {editorState.backgroundImage && editorState.replaceImages.length > 0 && !isExporting && (
        <p className="text-sm text-muted-foreground text-center">
          将导出 {editorState.replaceImages.length} 张处理后的图片
        </p>
      )}
    </div>
  )
}
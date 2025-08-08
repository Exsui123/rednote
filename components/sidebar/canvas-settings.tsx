"use client"

import { EditorState } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface CanvasSettingsProps {
  editorState: EditorState
  onStateChange: (state: EditorState) => void
}

export function CanvasSettings({ editorState, onStateChange }: CanvasSettingsProps) {
  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value) || 0
    onStateChange({
      ...editorState,
      canvasSize: {
        ...editorState.canvasSize,
        [dimension]: Math.max(1, numValue)
      }
    })
  }

  const handleZoomChange = (value: number[]) => {
    onStateChange({
      ...editorState,
      zoom: value[0]
    })
  }

  const setZoom = (zoom: number) => {
    onStateChange({
      ...editorState,
      zoom
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">画布尺寸</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="canvas-width">宽度 (px)</Label>
              <Input
                id="canvas-width"
                type="number"
                value={editorState.canvasSize.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canvas-height">高度 (px)</Label>
              <Input
                id="canvas-height"
                type="number"
                value={editorState.canvasSize.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStateChange({
                ...editorState,
                canvasSize: { width: 1242, height: 1656 }
              })}
            >
              默认尺寸
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onStateChange({
                ...editorState,
                canvasSize: { width: 1080, height: 1920 }
              })}
            >
              1080×1920
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">缩放控制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>缩放比例</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(editorState.zoom * 100)}%
              </span>
            </div>
            <Slider
              value={[editorState.zoom]}
              onValueChange={handleZoomChange}
              min={0.1}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setZoom(Math.max(0.1, editorState.zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setZoom(Math.min(2, editorState.zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setZoom(1)}
            >
              100%
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setZoom(0.5)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
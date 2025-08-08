"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PptPuzzleState, PuzzleImageItem } from "@/lib/types/ppt-puzzle"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ImageUploadSectionProps {
  puzzleState: PptPuzzleState
  onStateChange: (state: PptPuzzleState) => void
}

export function ImageUploadSection({ puzzleState, onStateChange }: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    const newImages: PuzzleImageItem[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('image/')) {
        const imageItem: PuzzleImageItem = {
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: "sub" // 默认为次图，用户后续可以修改
        }
        newImages.push(imageItem)
      }
    }

    // 由于新图片默认类型为"sub"，需要更新subImages数组
    onStateChange({
      ...puzzleState,
      images: [...puzzleState.images, ...newImages],
      subImages: [...puzzleState.subImages, ...newImages]
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeImage = (imageId: string) => {
    const updatedImages = puzzleState.images.filter(img => img.id !== imageId)
    
    // 同时从主图和次图数组中移除
    const updatedMainImages = puzzleState.mainImages.filter(img => img.id !== imageId)
    const updatedSubImages = puzzleState.subImages.filter(img => img.id !== imageId)
    
    // 清理URL
    const imageToRemove = puzzleState.images.find(img => img.id === imageId)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url)
    }

    onStateChange({
      ...puzzleState,
      images: updatedImages,
      mainImages: updatedMainImages,
      subImages: updatedSubImages
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">批量上传图片</Label>
        <p className="text-xs text-muted-foreground mt-1">
          支持 JPG、PNG、WebP 格式，可批量选择或拖拽上传
        </p>
      </div>

      {/* 上传区域 */}
      <Card
        className="border-2 border-dashed p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          点击选择图片或拖拽到此区域
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          支持批量选择多张图片
        </p>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />

      {/* 图片列表 */}
      {puzzleState.images.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            已上传图片 ({puzzleState.images.length})
          </Label>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {puzzleState.images.map((image) => (
              <div key={image.id} className="flex items-center gap-3 p-2 border rounded-lg">
                <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{image.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {image.type === "main" ? "主图" : "次图"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(image.id)}
                  className="p-1 h-auto text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {puzzleState.images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">还没有上传任何图片</p>
        </div>
      )}
    </div>
  )
}
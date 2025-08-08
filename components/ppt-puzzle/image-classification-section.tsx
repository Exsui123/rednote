"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { PptPuzzleState, PuzzleImageItem } from "@/lib/types/ppt-puzzle"
import { Star, StarOff, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageClassificationSectionProps {
  puzzleState: PptPuzzleState
  onStateChange: (state: PptPuzzleState) => void
}

export function ImageClassificationSection({ puzzleState, onStateChange }: ImageClassificationSectionProps) {
  
  const toggleImageType = (imageId: string) => {
    const updatedImages = puzzleState.images.map(img => {
      if (img.id === imageId) {
        return {
          ...img,
          type: img.type === "main" ? "sub" : "main" as "main" | "sub"
        }
      }
      return img
    })

    // 重新分组主图和次图
    const mainImages = updatedImages.filter(img => img.type === "main")
    const subImages = updatedImages.filter(img => img.type === "sub")

    onStateChange({
      ...puzzleState,
      images: updatedImages,
      mainImages,
      subImages
    })
  }

  const setAllAsMain = () => {
    const updatedImages = puzzleState.images.map(img => ({
      ...img,
      type: "main" as const
    }))

    onStateChange({
      ...puzzleState,
      images: updatedImages,
      mainImages: updatedImages,
      subImages: []
    })
  }

  const setAllAsSub = () => {
    const updatedImages = puzzleState.images.map(img => ({
      ...img,
      type: "sub" as const
    }))

    onStateChange({
      ...puzzleState,
      images: updatedImages,
      mainImages: [],
      subImages: updatedImages
    })
  }

  const mainCount = puzzleState.images.filter(img => img.type === "main").length
  const subCount = puzzleState.images.filter(img => img.type === "sub").length

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">图片分类</Label>
        <p className="text-xs text-muted-foreground mt-1">
          设置哪些图片作为主图（大图），哪些作为次图（小图）
        </p>
      </div>

      {/* 统计信息 */}
      <Card className="p-3">
        <div className="flex justify-between text-sm">
          <span>主图: <span className="font-medium text-orange-600">{mainCount}</span></span>
          <span>次图: <span className="font-medium text-blue-600">{subCount}</span></span>
        </div>
      </Card>

      {/* 批量操作 */}
      {puzzleState.images.length > 0 && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={setAllAsMain}
            className="flex-1"
          >
            全部设为主图
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={setAllAsSub}
            className="flex-1"
          >
            全部设为次图
          </Button>
        </div>
      )}

      {/* 图片分类列表 */}
      {puzzleState.images.length > 0 ? (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {puzzleState.images.map((image) => (
            <Card key={image.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{image.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      image.type === "main" 
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" 
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    )}>
                      {image.type === "main" ? "主图" : "次图"}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleImageType(image.id)}
                  className={cn(
                    "p-2 h-auto",
                    image.type === "main" 
                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                      : "text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                  )}
                >
                  {image.type === "main" ? (
                    <Star className="h-4 w-4 fill-current" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">请先上传图片</p>
        </div>
      )}

      {/* 布局提示 */}
      {puzzleState.images.length > 0 && (
        <Card className="p-3 bg-muted/50">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium">提示：</span>
            {puzzleState.layout === "1+4" && (
              " 1+4 布局需要 1 张主图和 4 张次图"
            )}
            {puzzleState.layout === "1+6" && (
              " 1+6 布局需要 1 张主图和 6 张次图"
            )}
            {puzzleState.layout === "2+4" && (
              " 2+4 布局需要 2 张主图和 4 张次图"
            )}
          </p>
        </Card>
      )}
    </div>
  )
}
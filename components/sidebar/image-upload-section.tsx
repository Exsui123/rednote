"use client"

import { useCallback } from "react"
import { EditorState, ImageFile } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ImageUploadSectionProps {
  editorState: EditorState
  onStateChange: (state: EditorState) => void
}

export function ImageUploadSection({ editorState, onStateChange }: ImageUploadSectionProps) {
  const handleBackgroundUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const imageFile: ImageFile = {
      id: Date.now().toString(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }

    onStateChange({
      ...editorState,
      backgroundImage: imageFile
    })
  }, [editorState, onStateChange])

  const handleReplaceImagesUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const newImages: ImageFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }))

    onStateChange({
      ...editorState,
      replaceImages: [...editorState.replaceImages, ...newImages]
    })
  }, [editorState, onStateChange])

  const removeReplaceImage = useCallback((id: string) => {
    const index = editorState.replaceImages.findIndex(img => img.id === id)
    const newImages = editorState.replaceImages.filter(img => img.id !== id)
    
    // Adjust current index if needed
    let newIndex = editorState.currentReplaceIndex
    if (index <= editorState.currentReplaceIndex && newImages.length > 0) {
      newIndex = Math.max(0, editorState.currentReplaceIndex - 1)
    }
    
    onStateChange({
      ...editorState,
      replaceImages: newImages,
      currentReplaceIndex: newIndex
    })
  }, [editorState, onStateChange])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">背景图片</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="bg-upload">
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary cursor-pointer transition-colors">
                <Input
                  id="bg-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload}
                  className="hidden"
                />
                {editorState.backgroundImage ? (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm truncate">{editorState.backgroundImage.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">点击上传背景图</span>
                  </div>
                )}
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">替换图片</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="replace-upload">
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary cursor-pointer transition-colors">
                <Input
                  id="replace-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReplaceImagesUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">点击批量上传替换图片</span>
                </div>
              </div>
            </Label>

            {editorState.replaceImages.length > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-sm text-muted-foreground">
                  已上传 {editorState.replaceImages.length} 张图片
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {editorState.replaceImages.map((img, index) => (
                    <div 
                      key={img.id} 
                      className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer ${
                        index === editorState.currentReplaceIndex ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => onStateChange({
                        ...editorState,
                        currentReplaceIndex: index
                      })}
                    >
                      <span className="truncate flex-1">{img.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeReplaceImage(img.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
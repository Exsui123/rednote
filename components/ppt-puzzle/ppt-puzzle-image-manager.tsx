"use client"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Trash2, 
  Upload, 
  Plus,
  Image as ImageIcon 
} from "lucide-react"
import { PptPuzzleState, PuzzleImageItem } from "@/lib/types/ppt-puzzle"
import Image from "next/image"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface PptPuzzleImageManagerProps {
  puzzleState: PptPuzzleState
  onStateChange: (state: PptPuzzleState) => void
}

interface SortableImageItemProps {
  image: PuzzleImageItem
  index: number
  onToggleVisibility: () => void
  onDelete: () => void
  onReplace: (file: File) => void
}

interface ImagePreviewProps {
  image: PuzzleImageItem
  index: number
  position: { x: number; y: number }
}

function ImagePreview({ image, index, position }: ImagePreviewProps) {
  return (
    <div
      className="fixed z-50 pointer-events-none bg-background border rounded-lg shadow-lg overflow-hidden"
      style={{
        left: position.x + 10,
        top: position.y - 150,
        width: 200,
        height: 150
      }}
    >
      <div className="relative w-full h-full">
        <Image
          src={image.url}
          alt={`Preview ${index + 1}`}
          fill
          className="object-contain"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2">
        <p className="truncate">{image.name}</p>
      </div>
    </div>
  )
}

function SortableImageItem({ 
  image, 
  index, 
  onToggleVisibility, 
  onDelete, 
  onReplace 
}: SortableImageItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onReplace(file)
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY })
    setShowPreview(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showPreview) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseLeave = () => {
    setShowPreview(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 p-3 bg-background rounded-lg border",
        isDragging && "opacity-50",
        !image.isVisible && "opacity-60"
      )}
    >
      {/* 顶部行：拖拽手柄 + 编号 + 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            #{index + 1}
          </span>
        </div>

        <div className="flex gap-1">
          <Button
            size="icon"
            variant={image.isVisible !== false ? "outline" : "secondary"}
            onClick={onToggleVisibility}
            className="h-7 w-7"
            title={image.isVisible !== false ? "隐藏图片" : "显示图片"}
          >
            {image.isVisible !== false ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 w-7"
            title="替换图片"
          >
            <Upload className="h-3 w-3" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            onClick={onDelete}
            className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
            title="删除图片"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 底部行：缩略图 + 文件名 */}
      <div className="flex items-center gap-3">
        <div 
          className="relative w-12 h-12 rounded overflow-hidden border bg-muted flex-shrink-0 cursor-pointer hover:border-primary transition-colors"
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <Image
            src={image.url}
            alt={`Image ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate" title={image.name}>
            {image.name}
          </p>
        </div>
      </div>

      {/* 预览组件 */}
      {showPreview && (
        <ImagePreview 
          image={image} 
          index={index} 
          position={mousePosition} 
        />
      )}
    </div>
  )
}

export function PptPuzzleImageManager({ 
  puzzleState, 
  onStateChange 
}: PptPuzzleImageManagerProps) {
  const [activeTab, setActiveTab] = useState<"main" | "sub">("main")
  const addMainFileInputRef = useRef<HTMLInputElement>(null)
  const addSubFileInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 为图片添加 isVisible 属性（默认为 true）
  const mainImagesWithVisibility = puzzleState.mainImages.map(img => ({
    ...img,
    isVisible: img.isVisible !== false
  }))

  const subImagesWithVisibility = puzzleState.subImages.map(img => ({
    ...img,
    isVisible: img.isVisible !== false
  }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const images = activeTab === "main" ? puzzleState.mainImages : puzzleState.subImages
      const oldIndex = images.findIndex(img => img.id === active.id)
      const newIndex = images.findIndex(img => img.id === over?.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(images, oldIndex, newIndex)
        
        // 重建完整的 images 数组
        const allImages = activeTab === "main" 
          ? [...newImages, ...puzzleState.subImages]
          : [...puzzleState.mainImages, ...newImages]
        
        onStateChange({
          ...puzzleState,
          images: allImages,
          [activeTab === "main" ? "mainImages" : "subImages"]: newImages
        })
      }
    }
  }

  const handleToggleVisibility = (id: string, type: "main" | "sub") => {
    const images = type === "main" ? puzzleState.mainImages : puzzleState.subImages
    const newImages = images.map(img => 
      img.id === id ? { ...img, isVisible: img.isVisible === false } : img
    )
    
    // 同步更新 images 数组
    const allImages = [...puzzleState.mainImages, ...puzzleState.subImages]
    const updatedAllImages = allImages.map(img => {
      const updatedImg = newImages.find(ni => ni.id === img.id)
      return updatedImg || img
    })
    
    onStateChange({
      ...puzzleState,
      images: updatedAllImages,
      [type === "main" ? "mainImages" : "subImages"]: newImages
    })
  }

  const handleDelete = (id: string, type: "main" | "sub") => {
    if (!confirm("确定要删除这张图片吗？")) return
    
    const images = type === "main" ? puzzleState.mainImages : puzzleState.subImages
    const newImages = images.filter(img => img.id !== id)
    
    // 同步更新 images 数组
    const allImages = puzzleState.images.filter(img => img.id !== id)
    
    onStateChange({
      ...puzzleState,
      images: allImages,
      [type === "main" ? "mainImages" : "subImages"]: newImages
    })
  }

  const handleReplace = async (id: string, file: File, type: "main" | "sub") => {
    const reader = new FileReader()
    reader.onload = (e) => {
      // 找到原图片以保持其可见性状态
      const images = type === "main" ? puzzleState.mainImages : puzzleState.subImages
      const originalImage = images.find(img => img.id === id)
      
      const newImage: PuzzleImageItem = {
        id: `${Date.now()}-${Math.random()}`,
        file: file,
        url: e.target?.result as string,
        name: file.name,
        type: type as "main" | "sub",
        // 保持原图片的可见性状态，如果原图片没有isVisible属性则默认为true
        isVisible: originalImage?.isVisible !== false
      }

      const newImages = images.map(img => 
        img.id === id ? newImage : img
      )
      
      // 同步更新 images 数组
      const allImages = puzzleState.images.map(img => 
        img.id === id ? newImage : img
      )
      
      onStateChange({
        ...puzzleState,
        images: allImages,
        [type === "main" ? "mainImages" : "subImages"]: newImages
      })
    }
    reader.readAsDataURL(file)
  }

  const handleAddImage = (files: FileList | null, type: "main" | "sub") => {
    if (!files) return

    const newImages: PuzzleImageItem[] = []
    let loadedCount = 0

    Array.from(files).forEach((file, fileIndex) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newImages.push({
          id: `${Date.now()}-${Math.random()}-${fileIndex}`,
          file: file,
          url: e.target?.result as string,
          name: file.name,
          type: type as "main" | "sub",
          isVisible: true
        })

        loadedCount++
        if (loadedCount === files.length) {
          const currentImages = type === "main" ? puzzleState.mainImages : puzzleState.subImages
          const updatedTypeImages = [...currentImages, ...newImages]
          
          // 同步更新 images 数组
          const allImages = [...puzzleState.images, ...newImages]
          
          onStateChange({
            ...puzzleState,
            images: allImages,
            [type === "main" ? "mainImages" : "subImages"]: updatedTypeImages
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="w-80 border-l bg-background flex flex-col h-screen">
      <div className="p-4 border-b flex-shrink-0">
        <h3 className="font-semibold">图片管理</h3>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "main" | "sub")} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 flex-shrink-0">
          <TabsTrigger value="main" className="flex-1">
            主图 ({puzzleState.mainImages.length})
          </TabsTrigger>
          <TabsTrigger value="sub" className="flex-1">
            次图 ({puzzleState.subImages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <ScrollArea className="flex-1 px-4 py-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mainImagesWithVisibility.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {mainImagesWithVisibility.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无主图</p>
                      <p className="text-xs mt-1">点击下方按钮添加</p>
                    </Card>
                  ) : (
                    mainImagesWithVisibility.map((image, index) => (
                      <SortableImageItem
                        key={image.id}
                        image={image}
                        index={index}
                        onToggleVisibility={() => handleToggleVisibility(image.id, "main")}
                        onDelete={() => handleDelete(image.id, "main")}
                        onReplace={(file) => handleReplace(image.id, file, "main")}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>

          <div className="p-4 border-t flex-shrink-0">
            <input
              ref={addMainFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAddImage(e.target.files, "main")}
              className="hidden"
            />
            <Button 
              className="w-full"
              onClick={() => addMainFileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加主图
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sub" className="flex-1 flex flex-col mt-0 overflow-hidden">
          <ScrollArea className="flex-1 px-4 py-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={subImagesWithVisibility.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {subImagesWithVisibility.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无次图</p>
                      <p className="text-xs mt-1">点击下方按钮添加</p>
                    </Card>
                  ) : (
                    subImagesWithVisibility.map((image, index) => (
                      <SortableImageItem
                        key={image.id}
                        image={image}
                        index={index}
                        onToggleVisibility={() => handleToggleVisibility(image.id, "sub")}
                        onDelete={() => handleDelete(image.id, "sub")}
                        onReplace={(file) => handleReplace(image.id, file, "sub")}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>

          <div className="p-4 border-t flex-shrink-0">
            <input
              ref={addSubFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAddImage(e.target.files, "sub")}
              className="hidden"
            />
            <Button 
              className="w-full"
              onClick={() => addSubFileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加次图
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
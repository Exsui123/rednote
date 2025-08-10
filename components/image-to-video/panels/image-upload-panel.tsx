'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useImageToVideo } from '@/lib/contexts/image-to-video-context'
import { X, Upload, Move, Clock } from 'lucide-react'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableImageItem({ image }: { image: any }) {
  const { removeImage, updateImageDuration } = useImageToVideo()
  const [duration, setDuration] = useState(image.duration)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  const handleDurationChange = (value: string) => {
    const newDuration = parseFloat(value)
    if (!isNaN(newDuration) && newDuration > 0) {
      setDuration(newDuration)
      updateImageDuration(image.id, newDuration)
    }
  }
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-move p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
      >
        <Move className="w-4 h-4" />
      </div>
      
      <div className="flex-1 flex items-center gap-2">
        <img 
          src={image.url} 
          alt={image.name}
          className="w-12 h-12 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{image.name}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <Input
              type="number"
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              className="w-16 h-6 text-xs px-1"
              step="0.5"
              min="0.5"
            />
            <span className="text-xs text-gray-500">秒</span>
          </div>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeImage(image.id)}
        className="p-1"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function ImageUploadPanel() {
  const { images, addImages, reorderImages } = useImageToVideo()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    )
    if (imageFiles.length > 0) {
      addImages(imageFiles)
    }
  }, [addImages])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true
  })
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = images.findIndex(img => img.id === active.id)
      const newIndex = images.findIndex(img => img.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderImages(oldIndex, newIndex)
      }
    }
  }
  
  const totalDuration = images.reduce((sum, img) => sum + img.duration, 0)
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">📁 图片上传管理</h3>
      
      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? '松开鼠标上传图片'
            : '拖拽图片到此处，或点击选择文件'
          }
        </p>
        <p className="text-xs text-gray-500 mt-2">
          支持 PNG, JPG, JPEG, GIF, WebP 格式
        </p>
      </div>
      
      {/* 图片列表 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">
              已上传 {images.length} 张图片
            </h4>
            <span className="text-sm text-gray-500">
              总时长: {totalDuration.toFixed(1)}秒
            </span>
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                {images.map(image => (
                  <SortableImageItem key={image.id} image={image} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          >
            + 添加更多图片
          </Button>
        </div>
      )}
      
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">还没有上传图片</p>
          <p className="text-xs mt-1">点击上方区域开始上传</p>
        </div>
      )}
    </div>
  )
}
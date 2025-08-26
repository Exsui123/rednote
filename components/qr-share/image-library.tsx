'use client';

import { useRef, useCallback } from 'react';
import { useImageShareStore } from '@/lib/stores/image-share-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square,
  Image as ImageIcon,
  Clock,
  FileImage
} from 'lucide-react';
import Image from 'next/image';

export function ImageLibrary() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    images,
    addImages,
    removeImage,
    toggleSelect,
    selectAll,
    unselectAll,
    getSelectedImages,
    clearImages,
    clearSelectedImages,
  } = useImageShareStore();

  const selectedImages = getSelectedImages();
  const hasSelected = selectedImages.length > 0;
  const allSelected = images.length > 0 && selectedImages.length === images.length;

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    let loadedCount = 0;
    const newImages: Array<{
      src: string;
      toolName: string;
      fileName?: string;
      size?: number;
    }> = [];

    filesArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages[index] = {
            src: event.target.result as string,
            toolName: '本地上传',
            fileName: file.name,
            size: file.size,
          };
          loadedCount++;
          
          // Add images when all are loaded
          if (loadedCount === filesArray.length) {
            addImages(newImages.filter(Boolean)); // Filter out any undefined entries
          }
        }
      };
      reader.onerror = () => {
        console.error(`Failed to read file: ${file.name}`);
        loadedCount++;
        
        // Still check if all files are processed (including errors)
        if (loadedCount === filesArray.length) {
          addImages(newImages.filter(Boolean));
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addImages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            待分享图片库 
            {images.length > 0 && (
              <span className="text-gray-500 ml-2">({images.length})</span>
            )}
          </h2>
          {hasSelected && (
            <Badge variant="secondary">
              已选择 {selectedImages.length} 张
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {images.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => allSelected ? unselectAll() : selectAll()}
              >
                {allSelected ? (
                  <>
                    <Square className="h-4 w-4 mr-1" />
                    取消全选
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    全选
                  </>
                )}
              </Button>
              {hasSelected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelectedImages}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除选中
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={clearImages}
                className="text-red-600 hover:text-red-700"
              >
                清空全部
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
              image.selected 
                ? 'border-blue-500 shadow-lg scale-105' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleSelect(image.id)}
          >
            {/* Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={image.selected}
                onCheckedChange={() => toggleSelect(image.id)}
                className="bg-white/90 backdrop-blur"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Delete Button */}
            <button
              className="absolute top-2 right-2 z-10 p-1 bg-white/90 backdrop-blur rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(image.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>

            {/* Image Preview */}
            <div className="aspect-square relative bg-gray-100">
              {image.src.startsWith('data:image') ? (
                <Image
                  src={image.src}
                  alt={image.fileName || 'Image'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FileImage className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Image Info */}
            <div className="p-2 bg-white">
              <div className="text-xs font-medium text-gray-700 truncate">
                {image.fileName || '未命名图片'}
              </div>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {image.toolName}
                </Badge>
                <span className="text-xs text-gray-500">
                  <Clock className="inline h-3 w-3 mr-0.5" />
                  {formatTime(image.timestamp)}
                </span>
              </div>
              {image.size && (
                <div className="text-xs text-gray-500 mt-1">
                  {formatFileSize(image.size)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Local Image Button */}
        <div
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-600 text-center px-2">
            添加本地图片
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </Card>
  );
}
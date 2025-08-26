"use client"

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X } from 'lucide-react'
import { WatermarkService } from '@/lib/services/watermark-service'
import type { DocumentFile } from '@/lib/types/watermark'

interface FileUploadProps {
  files: DocumentFile[]
  onFilesChange: (files: DocumentFile[]) => void
  maxFiles?: number
}

export function FileUpload({ files, onFilesChange, maxFiles = 10 }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: DocumentFile[] = acceptedFiles.map(file => ({
      file,
      name: file.name,
      type: WatermarkService.detectFileType(file),
      size: file.size
    }))
    
    // 过滤支持的文件类型
    const supportedFiles = newFiles.filter(f => f.type !== 'unknown')
    
    if (supportedFiles.length < newFiles.length) {
      alert('部分文件格式不支持，只支持 PDF 和 Word 文档')
    }
    
    onFilesChange([...files, ...supportedFiles].slice(0, maxFiles))
  }, [files, onFilesChange, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: maxFiles - files.length,
    multiple: true
  })

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: DocumentFile['type']) => {
    switch (type) {
      case 'pdf':
        return '📄'
      case 'word':
        return '📝'
      default:
        return '📄'
    }
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-blue-400 bg-blue-50' 
          : files.length >= maxFiles 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent className="p-8">
          <div 
            {...getRootProps()} 
            className={`text-center cursor-pointer ${
              files.length >= maxFiles ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive 
                ? '释放文件到此处...' 
                : files.length >= maxFiles
                  ? `已达到最大文件数量 (${maxFiles})`
                  : '拖拽文件到此处，或点击选择文件'
              }
            </h3>
            <p className="text-sm text-gray-500">
              支持 PDF、DOC、DOCX 格式，最多 {maxFiles} 个文件
            </p>
            {files.length < maxFiles && (
              <Button className="mt-4" variant="outline">
                选择文件
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 文件列表 */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              已选择文件 ({files.length})
            </h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • 
                        {file.type === 'pdf' ? 'PDF 文档' : 
                         file.type === 'word' ? 'Word 文档' : '未知格式'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {files.length < maxFiles && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  添加更多文件
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
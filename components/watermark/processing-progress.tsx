"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Download, Eye } from 'lucide-react'
import type { WatermarkProgress, WatermarkResult } from '@/lib/types/watermark'

interface ProcessingProgressProps {
  progress: WatermarkProgress[]
  results: WatermarkResult[]
  onDownload: (result: WatermarkResult, index: number) => void
  onPreview?: (result: WatermarkResult, index: number) => void
}

export function ProcessingProgress({ 
  progress, 
  results, 
  onDownload,
  onPreview 
}: ProcessingProgressProps) {
  const getStageText = (stage: WatermarkProgress['stage']) => {
    switch (stage) {
      case 'uploading': return '准备中'
      case 'converting': return '转换中'
      case 'watermarking': return '添加水印'
      case 'completed': return '完成'
      case 'error': return '错误'
      default: return '处理中'
    }
  }

  const getStageColor = (stage: WatermarkProgress['stage']) => {
    switch (stage) {
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  const formatProcessTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (progress.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">处理进度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.map((prog, index) => {
          const result = results[index]
          const isCompleted = prog.stage === 'completed'
          const isError = prog.stage === 'error'

          return (
            <div key={index} className="space-y-3">
              {/* 文件信息 */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    文件 {index + 1}: {result?.originalFile.name || `处理中...`}
                  </p>
                  <p className={`text-xs ${getStageColor(prog.stage)}`}>
                    {getStageText(prog.stage)}
                    {isCompleted && result && (
                      <span className="text-gray-500 ml-2">
                        ({formatProcessTime(result.processTime)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {isError && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              {/* 进度条 */}
              <div className="space-y-2">
                <Progress 
                  value={prog.progress} 
                  className={`w-full ${
                    isError ? '[&>div]:bg-red-500' :
                    isCompleted ? '[&>div]:bg-green-500' : ''
                  }`}
                />
                <p className="text-xs text-gray-500">
                  {prog.message}
                </p>
              </div>

              {/* 操作按钮 */}
              {isCompleted && result && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => onDownload(result, index)}
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载文件
                  </Button>
                  {onPreview && (
                    <Button
                      onClick={() => onPreview(result, index)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      预览
                    </Button>
                  )}
                </div>
              )}

              {isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{prog.message}</p>
                </div>
              )}

              {index < progress.length - 1 && (
                <hr className="border-gray-200" />
              )}
            </div>
          )
        })}

        {/* 批量操作 */}
        {results.length > 1 && results.every(r => r) && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                results.forEach((result, index) => {
                  if (result) onDownload(result, index)
                })
              }}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              下载全部文件 ({results.length})
            </Button>
          </div>
        )}

        {/* 统计信息 */}
        <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-medium text-gray-900">
                {progress.filter(p => p.stage === 'completed').length}
              </div>
              <div>已完成</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {progress.filter(p => !['completed', 'error'].includes(p.stage)).length}
              </div>
              <div>处理中</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {progress.filter(p => p.stage === 'error').length}
              </div>
              <div>失败</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
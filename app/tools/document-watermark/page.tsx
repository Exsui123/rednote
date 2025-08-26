"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Settings, Play, Download } from 'lucide-react'
import { FileUpload } from '@/components/watermark/file-upload'
import { WatermarkConfig } from '@/components/watermark/watermark-config'
import { ProcessingProgress } from '@/components/watermark/processing-progress'
import { WatermarkPreview } from '@/components/watermark/watermark-preview'
import { WatermarkService } from '@/lib/services/watermark-service'
import type { 
  DocumentFile, 
  WatermarkConfig as WatermarkConfigType,
  WatermarkProgress,
  WatermarkResult 
} from '@/lib/types/watermark'

export default function DocumentWatermarkPage() {
  const [files, setFiles] = useState<DocumentFile[]>([])
  const [config, setConfig] = useState<WatermarkConfigType>({
    text: '机密文档',
    fontSize: 36,
    opacity: 0.3,
    rotation: 45,
    color: '#ff0000',
    position: 'center',
    spacing: 150,
    pattern: 'diagonal'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<WatermarkProgress[]>([])
  const [results, setResults] = useState<WatermarkResult[]>([])
  const [selectedFileIndex, setSelectedFileIndex] = useState(0)

  const handleProcess = useCallback(async () => {
    if (files.length === 0) {
      alert('请先选择要添加水印的文件')
      return
    }

    if (!config.text.trim()) {
      alert('请输入水印文字')
      return
    }

    setIsProcessing(true)
    setProgress(files.map(() => ({
      stage: 'uploading' as const,
      progress: 0,
      message: '准备处理...'
    })))
    setResults([])

    const newResults: WatermarkResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const watermarkService = new WatermarkService((progressUpdate) => {
          setProgress(prev => prev.map((p, index) => 
            index === i ? progressUpdate : p
          ))
        })

        const result = await watermarkService.processDocument(file, config)
        newResults.push(result)
        
        setResults(prev => {
          const updated = [...prev]
          updated[i] = result
          return updated
        })
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error)
        
        setProgress(prev => prev.map((p, index) => 
          index === i ? {
            stage: 'error' as const,
            progress: 0,
            message: error instanceof Error ? error.message : '处理失败'
          } : p
        ))
      }
    }

    setIsProcessing(false)
  }, [files, config])

  const handleDownload = useCallback(async (result: WatermarkResult, index: number) => {
    const filename = `水印_${result.originalFile.name.replace(/\.[^/.]+$/, '')}.pdf`
    await WatermarkService.downloadFile(result, filename)
  }, [])

  const canProcess = files.length > 0 && config.text.trim() && !isProcessing

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            文档水印工具
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            为 PDF 和 Word 文档添加难以删除的水印，支持多种水印模式和自定义配置
          </p>
        </div>

        <div className="grid xl:grid-cols-5 lg:grid-cols-3 gap-6">
          {/* 左侧：文件上传和配置 */}
          <div className="xl:col-span-2 lg:col-span-2 space-y-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  文件上传
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  水印配置
                </TabsTrigger>
                <TabsTrigger value="process" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  开始处理
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <FileUpload
                  files={files}
                  onFilesChange={setFiles}
                  maxFiles={10}
                />
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <WatermarkConfig
                  config={config}
                  onChange={setConfig}
                />
                
                {/* 移动端预览 */}
                <div className="xl:hidden">
                  <WatermarkPreview
                    files={files}
                    config={config}
                    selectedFileIndex={selectedFileIndex}
                    onFileChange={setSelectedFileIndex}
                  />
                </div>
              </TabsContent>

              <TabsContent value="process" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      处理设置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">处理预览</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• 文件数量: {files.length}</p>
                        <p>• 水印文字: &ldquo;{config.text}&rdquo;</p>
                        <p>• 水印模式: {
                          config.pattern === 'single' ? '单个水印' :
                          config.pattern === 'repeat' ? '重复水印' :
                          config.pattern === 'grid' ? '网格水印' :
                          config.pattern === 'diagonal' ? '对角线水印' : config.pattern
                        }</p>
                        <p>• 预计处理时间: {Math.max(files.length * 2, 5)} 秒</p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleProcess}
                      disabled={!canProcess}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>处理中...</>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          开始添加水印
                        </>
                      )}
                    </Button>

                    {!canProcess && files.length === 0 && (
                      <p className="text-sm text-gray-500 text-center">
                        请先上传文件
                      </p>
                    )}
                    
                    {!canProcess && files.length > 0 && !config.text.trim() && (
                      <p className="text-sm text-gray-500 text-center">
                        请配置水印文字
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 中间：实时预览 */}
          <div className="xl:col-span-2 lg:hidden xl:block">
            <WatermarkPreview
              files={files}
              config={config}
              selectedFileIndex={selectedFileIndex}
              onFileChange={setSelectedFileIndex}
            />
          </div>

          {/* 右侧：进度和结果 */}
          <div className="xl:col-span-1 lg:col-span-1 space-y-6">
            {/* 快速统计 */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                    <div className="text-sm text-gray-500">待处理文件</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r).length}
                    </div>
                    <div className="text-sm text-gray-500">已完成</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 处理进度 */}
            {progress.length > 0 && (
              <ProcessingProgress
                progress={progress}
                results={results}
                onDownload={handleDownload}
              />
            )}

            {/* 使用说明 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">使用说明</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-2">
                <p>1. 上传 PDF 或 Word 文档</p>
                <p>2. 配置水印文字和样式</p>
                <p>3. 选择水印模式和位置</p>
                <p>4. 开始处理并下载结果</p>
                <div className="pt-2 border-t">
                  <p className="font-medium text-orange-600">安全提示:</p>
                  <p>所有处理都在本地完成，文件不会上传到服务器</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
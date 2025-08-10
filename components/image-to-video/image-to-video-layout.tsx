'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ImageUploadPanel } from './panels/image-upload-panel'
import { VideoSettingsPanel } from './panels/video-settings-panel'
import { GeneratePanel } from './panels/generate-panel'
import { VideoPreview } from './video-preview'
import { ImageToVideoProvider } from '@/lib/contexts/image-to-video-context'

export function ImageToVideoLayout() {
  const [activeTab, setActiveTab] = useState('upload')
  
  return (
    <ImageToVideoProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* 左侧配置面板 */}
        <Card className="lg:col-span-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">📁 上传</TabsTrigger>
              <TabsTrigger value="settings">⚙️ 设置</TabsTrigger>
              <TabsTrigger value="generate">🎯 操作</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="upload" className="h-full p-4">
                <ImageUploadPanel />
              </TabsContent>
              
              <TabsContent value="settings" className="h-full p-4">
                <VideoSettingsPanel />
              </TabsContent>
              
              <TabsContent value="generate" className="h-full p-4">
                <GeneratePanel />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
        
        {/* 右侧视频预览区 */}
        <Card className="lg:col-span-2 overflow-hidden">
          <VideoPreview />
        </Card>
      </div>
    </ImageToVideoProvider>
  )
}
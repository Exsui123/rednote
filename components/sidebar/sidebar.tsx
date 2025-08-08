"use client"

import { EditorState } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploadSection } from "./image-upload-section"
import { CanvasSettings } from "./canvas-settings"
import { ExportSection } from "./export-section"

interface SidebarProps {
  editorState: EditorState
  onStateChange: (state: EditorState) => void
}

export function Sidebar({ editorState, onStateChange }: SidebarProps) {
  return (
    <div className="w-80 border-r bg-background p-4 overflow-y-auto">
      <h1 className="text-xl font-semibold mb-4">背景替换工具</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">图片</TabsTrigger>
          <TabsTrigger value="canvas">画布</TabsTrigger>
          <TabsTrigger value="export">导出</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <ImageUploadSection 
            editorState={editorState}
            onStateChange={onStateChange}
          />
        </TabsContent>
        
        <TabsContent value="canvas">
          <CanvasSettings 
            editorState={editorState}
            onStateChange={onStateChange}
          />
        </TabsContent>
        
        <TabsContent value="export">
          <ExportSection 
            editorState={editorState}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
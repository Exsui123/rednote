"use client"

import { PptPuzzleState } from "@/lib/types/ppt-puzzle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUploadSection } from "./image-upload-section"
import { ImageClassificationSection } from "./image-classification-section"
import { LayoutSettingsSection } from "./layout-settings-section"
import { ExportSection } from "./export-section"

interface PptPuzzleSidebarProps {
  puzzleState: PptPuzzleState
  onStateChange: (state: PptPuzzleState) => void
}

export function PptPuzzleSidebar({ puzzleState, onStateChange }: PptPuzzleSidebarProps) {
  return (
    <div className="w-80 border-r bg-background p-4 overflow-y-auto">
      <h1 className="text-xl font-semibold mb-4">PPT拼图工具</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">上传</TabsTrigger>
          <TabsTrigger value="classify">分类</TabsTrigger>
          <TabsTrigger value="layout">布局</TabsTrigger>
          <TabsTrigger value="export">导出</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <ImageUploadSection 
            puzzleState={puzzleState}
            onStateChange={onStateChange}
          />
        </TabsContent>
        
        <TabsContent value="classify" className="space-y-4">
          <ImageClassificationSection 
            puzzleState={puzzleState}
            onStateChange={onStateChange}
          />
        </TabsContent>
        
        <TabsContent value="layout" className="space-y-4">
          <LayoutSettingsSection 
            puzzleState={puzzleState}
            onStateChange={onStateChange}
          />
        </TabsContent>
        
        <TabsContent value="export">
          <ExportSection 
            puzzleState={puzzleState}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
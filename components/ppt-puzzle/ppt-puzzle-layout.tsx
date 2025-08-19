"use client"

import { PptPuzzleSidebar } from "./ppt-puzzle-sidebar"
import { PptPuzzleCanvas } from "./ppt-puzzle-canvas"
import { PptPuzzleImageManager } from "./ppt-puzzle-image-manager"
import { PptPuzzleState } from "@/lib/types/ppt-puzzle"
import { usePuzzleState } from "@/lib/hooks/use-puzzle-state"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Trash2 } from "lucide-react"

const defaultCanvasSize = {
  width: 1242,
  height: 1656
}

const initialState: PptPuzzleState = {
  images: [],
  mainImages: [],
  subImages: [],
  layout: "custom",  // 使用custom作为默认，完全依据主次图数量和配比
  direction: "left-main",
  subPerMain: 2,  // 默认每个主图配2个次图
  mainPerPage: 4,  // 默认每页4个主图
  subRatio: 0.3,  // 默认次图为主图的30%大小
  canvasSize: defaultCanvasSize,
  zoom: 0.8,
  spacing: 10,
  backgroundColor: "#ffffff",
  showPuzzle: false,
  currentBatchIndex: 0,  // 当前批次索引
  totalBatches: 1  // 总批次数
}

export function PptPuzzleLayout() {
  const { state: puzzleState, setState: setPuzzleState, undo, redo, canUndo, canRedo, clearStorage } = usePuzzleState(initialState)

  return (
    <div className="flex h-screen bg-background">
      <PptPuzzleSidebar 
        puzzleState={puzzleState}
        onStateChange={setPuzzleState}
      />
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={!canUndo}
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={!canRedo}
              title="重做 (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              数据已自动保存
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
                  clearStorage()
                }
              }}
              title="清除所有数据"
            >
              <Trash2 className="h-4 w-4" />
              清除数据
            </Button>
          </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          <PptPuzzleCanvas 
            puzzleState={puzzleState}
            onStateChange={setPuzzleState}
          />
        </div>
      </div>
      <PptPuzzleImageManager
        puzzleState={puzzleState}
        onStateChange={setPuzzleState}
      />
    </div>
  )
}
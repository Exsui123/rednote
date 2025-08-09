"use client"

import { useState } from "react"
import { PptPuzzleSidebar } from "./ppt-puzzle-sidebar"
import { PptPuzzleCanvas } from "./ppt-puzzle-canvas"
import { PptPuzzleImageManager } from "./ppt-puzzle-image-manager"
import { PptPuzzleState } from "@/lib/types/ppt-puzzle"

const defaultCanvasSize = {
  width: 1242,
  height: 1656
}

export function PptPuzzleLayout() {
  const [puzzleState, setPuzzleState] = useState<PptPuzzleState>({
    images: [],
    mainImages: [],
    subImages: [],
    layout: "custom",  // 使用custom作为默认，完全依据主次图数量和配比
    direction: "left-main",
    subPerMain: 2,  // 默认每个主图配2个次图
    subRatio: 0.3,  // 默认次图为主图的30%大小
    canvasSize: defaultCanvasSize,
    zoom: 0.8,
    spacing: 10,
    backgroundColor: "#ffffff",
    showPuzzle: false
  })

  return (
    <div className="flex h-screen bg-background">
      <PptPuzzleSidebar 
        puzzleState={puzzleState}
        onStateChange={setPuzzleState}
      />
      <div className="flex-1 flex flex-col">
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
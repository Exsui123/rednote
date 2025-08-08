"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Canvas } from "@/components/editor/canvas"
import { EditorState } from "@/lib/types"

const defaultCanvasSize = {
  width: 1242,
  height: 1656
}

export function EditorLayout() {
  const [editorState, setEditorState] = useState<EditorState>({
    backgroundImage: null,
    replaceImages: [],
    currentReplaceIndex: 0,
    canvasSize: defaultCanvasSize,
    zoom: 0.5
  })

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        editorState={editorState}
        onStateChange={setEditorState}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          <Canvas 
            editorState={editorState}
            onStateChange={setEditorState}
          />
        </div>
      </div>
    </div>
  )
}
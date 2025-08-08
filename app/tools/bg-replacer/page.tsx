import { Suspense } from "react"
import { EditorLayout } from "@/components/editor/editor-layout"
import { Navigation } from "@/components/ui/navigation"

export default function BgReplacerPage() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation showBackButton title="背景替换工具" />
      <div className="flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
          <EditorLayout />
        </Suspense>
      </div>
    </div>
  )
}
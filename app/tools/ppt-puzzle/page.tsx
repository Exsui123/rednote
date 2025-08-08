import { Suspense } from "react"
import { PptPuzzleLayout } from "@/components/ppt-puzzle/ppt-puzzle-layout"
import { Navigation } from "@/components/ui/navigation"

export default function PptPuzzlePage() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation showBackButton title="PPT拼图工具" />
      <div className="flex-1">
        <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
          <PptPuzzleLayout />
        </Suspense>
      </div>
    </div>
  )
}
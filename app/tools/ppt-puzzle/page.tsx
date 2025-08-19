"use client"

import { Suspense, lazy } from "react"
import { Navigation } from "@/components/ui/navigation"

// 使用lazy loading避免SSR问题
const PptPuzzleLayout = lazy(() => 
  import('@/components/ppt-puzzle/ppt-puzzle-layout').then(module => ({
    default: module.PptPuzzleLayout
  }))
)

export default function PptPuzzlePage() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation showBackButton title="PPT拼图工具" />
      <div className="flex-1">
        <Suspense fallback={
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        }>
          <PptPuzzleLayout />
        </Suspense>
      </div>
    </div>
  )
}
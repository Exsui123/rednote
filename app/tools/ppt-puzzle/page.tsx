import dynamic from 'next/dynamic'
import { Navigation } from "@/components/ui/navigation"

// 使用dynamic import禁用SSR，避免localStorage导致的hydration错误
const PptPuzzleLayout = dynamic(
  () => import('@/components/ppt-puzzle/ppt-puzzle-layout').then(mod => mod.PptPuzzleLayout),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }
)

export default function PptPuzzlePage() {
  return (
    <div className="h-screen flex flex-col">
      <Navigation showBackButton title="PPT拼图工具" />
      <div className="flex-1">
        <PptPuzzleLayout />
      </div>
    </div>
  )
}
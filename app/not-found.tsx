import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="text-6xl font-bold text-slate-300">404</div>
        <h1 className="text-2xl font-semibold text-slate-900">页面未找到</h1>
        <p className="text-slate-600">
          抱歉，你访问的页面不存在或已被移除
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回上页
          </Button>
        </div>
      </div>
    </div>
  )
}
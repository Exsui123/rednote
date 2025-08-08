"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"

interface NavigationProps {
  showBackButton?: boolean
  title?: string
}

export function Navigation({ showBackButton = false, title }: NavigationProps) {
  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回工具箱
              </Button>
            </Link>
          )}
          {title && (
            <h1 className="text-xl font-semibold text-slate-900">
              {title}
            </h1>
          )}
        </div>
        
        {!showBackButton && (
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              首页
            </Button>
          </Link>
        )}
      </div>
    </nav>
  )
}
"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, ArrowRight, Grid3X3, Video } from "lucide-react"

interface ToolCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  category: string
}

const tools: ToolCard[] = [
  {
    id: "bg-replacer",
    title: "背景替换工具",
    description: "上传背景图和多张替换图片，批量生成透视变换后的合成图片",
    icon: <ImageIcon className="h-8 w-8" />,
    href: "/tools/bg-replacer",
    category: "图像处理"
  },
  {
    id: "ppt-puzzle",
    title: "PPT拼图",
    description: "批量上传图片，设置主图和次图，生成多种布局的拼图效果",
    icon: <Grid3X3 className="h-8 w-8" />,
    href: "/tools/ppt-puzzle",
    category: "图像处理"
  },
  {
    id: "image-to-video",
    title: "图片转视频",
    description: "将多张图片合成为精美视频，支持转场效果、背景音乐和文字标题",
    icon: <Video className="h-8 w-8" />,
    href: "/tools/image-to-video",
    category: "视频处理"
  },
  // 可以在这里添加更多工具
]

const categories = Array.from(new Set(tools.map(tool => tool.category)))

export function ToolsHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            工具箱
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            为你的工作提供各种实用工具，提高效率，简化流程
          </p>
        </div>

        {/* Tools by Category */}
        {categories.map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools
                .filter(tool => tool.category === category)
                .map(tool => (
                  <Card key={tool.id} className="hover:shadow-lg transition-all duration-200 group">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                          {tool.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl text-slate-900">
                            {tool.title}
                          </CardTitle>
                        </div>
                      </div>
                      <CardDescription className="text-slate-600 leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={tool.href}>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          开始使用
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <p className="text-slate-500">
            更多工具正在开发中，敬请期待...
          </p>
        </div>
      </div>
    </div>
  )
}
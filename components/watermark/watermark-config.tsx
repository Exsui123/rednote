"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { WatermarkConfig } from '@/lib/types/watermark'

interface WatermarkConfigProps {
  config: WatermarkConfig
  onChange: (config: WatermarkConfig) => void
}

export function WatermarkConfig({ config, onChange }: WatermarkConfigProps) {
  const updateConfig = (updates: Partial<WatermarkConfig>) => {
    onChange({ ...config, ...updates })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">水印配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 水印文字 */}
        <div className="space-y-2">
          <Label htmlFor="watermark-text">水印文字</Label>
          <Input
            id="watermark-text"
            value={config.text}
            onChange={(e) => updateConfig({ text: e.target.value })}
            placeholder="输入水印文字"
            className="w-full"
          />
        </div>

        {/* 字体大小 */}
        <div className="space-y-2">
          <Label>字体大小: {config.fontSize}px</Label>
          <Slider
            value={[config.fontSize]}
            onValueChange={(value) => updateConfig({ fontSize: value[0] })}
            min={8}
            max={72}
            step={2}
            className="w-full"
          />
        </div>

        {/* 透明度 */}
        <div className="space-y-2">
          <Label>透明度: {Math.round(config.opacity * 100)}%</Label>
          <Slider
            value={[config.opacity]}
            onValueChange={(value) => updateConfig({ opacity: value[0] })}
            min={0.1}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* 旋转角度 */}
        <div className="space-y-2">
          <Label>旋转角度: {config.rotation}°</Label>
          <Slider
            value={[config.rotation]}
            onValueChange={(value) => updateConfig({ rotation: value[0] })}
            min={-90}
            max={90}
            step={15}
            className="w-full"
          />
        </div>

        {/* 颜色 */}
        <div className="space-y-2">
          <Label htmlFor="watermark-color">颜色</Label>
          <div className="flex gap-2">
            <Input
              id="watermark-color"
              type="color"
              value={config.color}
              onChange={(e) => updateConfig({ color: e.target.value })}
              className="w-16 h-10 p-1 border"
            />
            <Input
              value={config.color}
              onChange={(e) => updateConfig({ color: e.target.value })}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        {/* 位置 */}
        <div className="space-y-2">
          <Label>水印位置</Label>
          <Select 
            value={config.position} 
            onValueChange={(value: WatermarkConfig['position']) => updateConfig({ position: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="center">居中</SelectItem>
              <SelectItem value="top-left">左上角</SelectItem>
              <SelectItem value="top-center">上方中央</SelectItem>
              <SelectItem value="top-right">右上角</SelectItem>
              <SelectItem value="middle-left">左侧中央</SelectItem>
              <SelectItem value="middle-right">右侧中央</SelectItem>
              <SelectItem value="bottom-left">左下角</SelectItem>
              <SelectItem value="bottom-center">下方中央</SelectItem>
              <SelectItem value="bottom-right">右下角</SelectItem>
              <SelectItem value="full-page">全页</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 水印模式 */}
        <div className="space-y-2">
          <Label>水印模式</Label>
          <Select 
            value={config.pattern} 
            onValueChange={(value: WatermarkConfig['pattern']) => updateConfig({ pattern: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">单个水印</SelectItem>
              <SelectItem value="repeat">重复水印</SelectItem>
              <SelectItem value="grid">网格水印</SelectItem>
              <SelectItem value="diagonal">对角线水印</SelectItem>
              <SelectItem value="paranoid">🔒 偏执狂模式</SelectItem>
              <SelectItem value="anti-removal">🛡️ 反去水印模式</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 间距 */}
        {(config.pattern === 'repeat' || config.pattern === 'grid' || config.pattern === 'diagonal' || config.pattern === 'paranoid' || config.pattern === 'anti-removal') && (
          <div className="space-y-2">
            <Label>水印间距: {config.spacing}px</Label>
            <Slider
              value={[config.spacing]}
              onValueChange={(value) => updateConfig({ spacing: value[0] })}
              min={50}
              max={300}
              step={25}
              className="w-full"
            />
          </div>
        )}

        {/* 预设配置 */}
        <div className="space-y-2">
          <Label>快速预设</Label>
          <div className="grid grid-cols-2 gap-2">
            {/* 偏执狂模式预设 */}
            <button
              onClick={() => updateConfig({
                text: '高度机密',
                fontSize: 42,
                opacity: 0.25,
                rotation: 25,
                color: '#cc0000',
                pattern: 'paranoid',
                spacing: 100,
                randomSeed: Date.now().toString()
              })}
              className="col-span-2 p-3 text-sm bg-red-100 text-red-800 rounded-lg border-2 border-red-300 hover:bg-red-150 font-semibold"
            >
              🔒 偏执狂模式 - 高度防护
            </button>
            {/* 反去水印模式预设 */}
            <button
              onClick={() => updateConfig({
                text: '版权保护',
                fontSize: 38,
                opacity: 0.2,
                rotation: 15,
                color: '#990000',
                pattern: 'anti-removal',
                spacing: 120,
                randomSeed: Date.now().toString()
              })}
              className="col-span-2 p-3 text-sm bg-blue-100 text-blue-800 rounded-lg border-2 border-blue-300 hover:bg-blue-150 font-semibold"
            >
              🛡️ 反去水印模式 - 对抗算法
            </button>
            <button
              onClick={() => updateConfig({
                text: '机密文档',
                fontSize: 48,
                opacity: 0.3,
                rotation: 45,
                color: '#ff0000',
                pattern: 'diagonal',
                spacing: 150
              })}
              className="p-2 text-sm bg-red-50 text-red-700 rounded border hover:bg-red-100"
            >
              机密文档
            </button>
            <button
              onClick={() => updateConfig({
                text: '内部资料',
                fontSize: 24,
                opacity: 0.2,
                rotation: 0,
                color: '#666666',
                pattern: 'grid',
                spacing: 100
              })}
              className="p-2 text-sm bg-gray-50 text-gray-700 rounded border hover:bg-gray-100"
            >
              内部资料
            </button>
            <button
              onClick={() => updateConfig({
                text: '禁止复制',
                fontSize: 36,
                opacity: 0.4,
                rotation: -45,
                color: '#0066cc',
                pattern: 'repeat',
                spacing: 120
              })}
              className="p-2 text-sm bg-blue-50 text-blue-700 rounded border hover:bg-blue-100"
            >
              禁止复制
            </button>
            <button
              onClick={() => updateConfig({
                text: '仅供参考',
                fontSize: 20,
                opacity: 0.15,
                rotation: 30,
                color: '#008800',
                pattern: 'grid',
                spacing: 200
              })}
              className="p-2 text-sm bg-green-50 text-green-700 rounded border hover:bg-green-100"
            >
              仅供参考
            </button>
          </div>
        </div>

        {/* 偏执狂模式说明 */}
        {config.pattern === 'paranoid' && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-orange-600 font-bold text-lg">🔒</div>
              <div>
                <h4 className="font-semibold text-orange-800 mb-1">偏执狂模式已启用</h4>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>• 四层防护：随机化网格 + 噪声水印 + 边界混淆 + 微观标记</p>
                  <p>• 随机化参数：位置、大小、角度、透明度全部随机化</p>
                  <p>• 高强度防护：即使专业用户也难以完全去除</p>
                  <p className="font-medium">⚠️ 注意：此模式会显著增加水印密度</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 反去水印模式说明 */}
        {config.pattern === 'anti-removal' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 font-bold text-lg">🛡️</div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">反去水印模式已启用</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• 混合策略：模拟Word水印 + 自定义随机化 + 频域隐藏</p>
                  <p>• 对抗检测：添加假特征混淆去水印算法</p>
                  <p>• 内容相关：基于页面几何特征的智能分布</p>
                  <p>• 多重防护：让不同的去水印算法都无法完全成功</p>
                  <p className="font-medium text-blue-800">💡 专门针对你遇到的问题设计！</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
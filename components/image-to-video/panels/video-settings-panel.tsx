'use client'

import { useImageToVideo, availableTransitions } from '@/lib/contexts/image-to-video-context'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Music, Type, Settings, Palette, AspectRatio } from 'lucide-react'

export function VideoSettingsPanel() {
  const { 
    videoSettings, 
    updateVideoSettings,
    setTransition,
    images,
    audioSettings,
    updateAudioSettings,
    textSettings,
    updateTextSettings
  } = useImageToVideo()
  
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      updateAudioSettings({ file })
    }
  }
  
  return (
    <div className="space-y-6">
      {/* 基础参数 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          基础参数
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label>画布比例</Label>
            <Select 
              value={videoSettings.aspectRatio}
              onValueChange={(value: any) => updateVideoSettings({ aspectRatio: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                <SelectItem value="4:3">4:3 (标准)</SelectItem>
                <SelectItem value="3:4">3:4 (竖向)</SelectItem>
                <SelectItem value="1:1">1:1 (正方形)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>分辨率</Label>
            <Select 
              value={videoSettings.resolution}
              onValueChange={(value: any) => updateVideoSettings({ resolution: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="720p">720P</SelectItem>
                <SelectItem value="1080p">1080P</SelectItem>
                <SelectItem value="4k">4K</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>帧率</Label>
            <Select 
              value={videoSettings.fps.toString()}
              onValueChange={(value) => updateVideoSettings({ fps: parseInt(value) as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 fps</SelectItem>
                <SelectItem value="30">30 fps</SelectItem>
                <SelectItem value="60">60 fps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>图片默认时长 (秒)</Label>
            <Input
              type="number"
              value={videoSettings.defaultDuration}
              onChange={(e) => updateVideoSettings({ 
                defaultDuration: parseFloat(e.target.value) || 3 
              })}
              step="0.5"
              min="0.5"
            />
          </div>
        </div>
      </div>
      
      {/* 转场效果 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          转场效果
        </h3>
        
        <div>
          <Label>全局转场</Label>
          <Select 
            value={videoSettings.globalTransition}
            onValueChange={(value) => updateVideoSettings({ globalTransition: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTransitions.map(transition => (
                <SelectItem key={transition.id} value={transition.value}>
                  {transition.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {images.length > 1 && (
          <div className="space-y-2">
            <Label>单独设置转场</Label>
            {images.slice(0, -1).map((image, index) => {
              const nextImage = images[index + 1]
              const transitionKey = `${image.id}-${nextImage.id}`
              const currentTransition = videoSettings.transitions[transitionKey] || videoSettings.globalTransition
              
              return (
                <div key={transitionKey} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-24">
                    图{index + 1} → 图{index + 2}
                  </span>
                  <Select 
                    value={currentTransition}
                    onValueChange={(value) => setTransition(image.id, nextImage.id, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTransitions.map(transition => (
                        <SelectItem key={transition.id} value={transition.value}>
                          {transition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* 音频设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Music className="w-5 h-5" />
          音频设置
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label>背景音乐</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="flex-1"
              />
              {audioSettings.file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateAudioSettings({ file: null })}
                >
                  清除
                </Button>
              )}
            </div>
            {audioSettings.file && (
              <p className="text-sm text-gray-500 mt-1">
                已选择: {audioSettings.file.name}
              </p>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>音量</Label>
              <span className="text-sm text-gray-500">{audioSettings.volume}%</span>
            </div>
            <Slider
              value={[audioSettings.volume]}
              onValueChange={([value]) => updateAudioSettings({ volume: value })}
              max={100}
              step={5}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>循环播放</Label>
            <Switch
              checked={audioSettings.loop}
              onCheckedChange={(checked) => updateAudioSettings({ loop: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>淡入淡出</Label>
            <Switch
              checked={audioSettings.fadeInOut}
              onCheckedChange={(checked) => updateAudioSettings({ fadeInOut: checked })}
            />
          </div>
        </div>
      </div>
      
      {/* 文字设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Type className="w-5 h-5" />
          文字设置
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label>标题文字</Label>
            <Input
              value={textSettings.title}
              onChange={(e) => updateTextSettings({ title: e.target.value })}
              placeholder="输入标题文字"
            />
          </div>
          
          <div>
            <Label>字体大小</Label>
            <Input
              type="number"
              value={textSettings.fontSize}
              onChange={(e) => updateTextSettings({ 
                fontSize: parseInt(e.target.value) || 32 
              })}
              min="12"
              max="120"
            />
          </div>
          
          <div>
            <Label>文字颜色</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={textSettings.color}
                onChange={(e) => updateTextSettings({ color: e.target.value })}
                className="w-20"
              />
              <Input
                value={textSettings.color}
                onChange={(e) => updateTextSettings({ color: e.target.value })}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <Label>文字位置</Label>
            <Select 
              value={textSettings.position}
              onValueChange={(value: any) => updateTextSettings({ position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">上方</SelectItem>
                <SelectItem value="center">中央</SelectItem>
                <SelectItem value="bottom">下方</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
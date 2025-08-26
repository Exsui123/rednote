'use client';

import { WatermarkConfig, ProtectionMode } from '@/lib/types/smart-watermark';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface ConfigPanelProps {
  config: WatermarkConfig;
  onConfigChange: (config: Partial<WatermarkConfig>) => void;
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Basic Settings */}
      <div className="space-y-4">
        <div className="font-semibold text-gray-800 border-b pb-2">
          ⚙️ 基础设置
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="watermark-text">水印文字</Label>
            <Input
              id="watermark-text"
              value={config.text}
              onChange={(e) => onConfigChange({ text: e.target.value })}
              placeholder="输入水印文字"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="font-size">字体大小: {config.fontSize}px</Label>
            <Slider
              id="font-size"
              min={20}
              max={100}
              step={4}
              value={[config.fontSize]}
              onValueChange={([value]) => onConfigChange({ fontSize: value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="opacity">透明度: {Math.round(config.opacity * 100)}%</Label>
            <Slider
              id="opacity"
              min={0}
              max={100}
              step={5}
              value={[config.opacity * 100]}
              onValueChange={([value]) => onConfigChange({ opacity: value / 100 })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="color">颜色</Label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="color"
                id="color"
                value={config.color}
                onChange={(e) => onConfigChange({ color: e.target.value })}
                className="h-10 w-20 border rounded cursor-pointer"
              />
              <Input
                value={config.color}
                onChange={(e) => onConfigChange({ color: e.target.value })}
                className="flex-1"
                placeholder="#999999"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Protection Strategy */}
      <div className="space-y-4">
        <div className="font-semibold text-gray-800 border-b pb-2">
          🛡️ 防护策略
        </div>
        
        <RadioGroup
          value={config.protectionMode}
          onValueChange={(value) => onConfigChange({ protectionMode: value as ProtectionMode })}
        >
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="smart" id="smart" />
              <div className="flex-1">
                <Label htmlFor="smart" className="font-normal cursor-pointer">
                  <span className="font-medium">智能均衡 ⭐</span>
                  <p className="text-sm text-gray-600 mt-1">推荐：防护与可读性平衡</p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="heavy" id="heavy" />
              <div className="flex-1">
                <Label htmlFor="heavy" className="font-normal cursor-pointer">
                  <span className="font-medium">重点防护</span>
                  <p className="text-sm text-gray-600 mt-1">加强：提高水印密度</p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="light" id="light" />
              <div className="flex-1">
                <Label htmlFor="light" className="font-normal cursor-pointer">
                  <span className="font-medium">轻度标记</span>
                  <p className="text-sm text-gray-600 mt-1">简约：仅基础标识</p>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <div className="flex-1">
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  <span className="font-medium">自定义配置</span>
                  <p className="text-sm text-gray-600 mt-1">专业：完全手动控制</p>
                </Label>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Page Settings */}
      <div className="space-y-4">
        <div className="font-semibold text-gray-800 border-b pb-2">
          📄 页面设置
        </div>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>应用范围</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-all"
                  checked={config.pageSettings.applyToAll}
                  onCheckedChange={(checked) => 
                    onConfigChange({
                      pageSettings: { ...config.pageSettings, applyToAll: !!checked }
                    })
                  }
                />
                <Label htmlFor="apply-all" className="font-normal cursor-pointer">
                  所有页面
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-first"
                  checked={config.pageSettings.applyToFirst}
                  onCheckedChange={(checked) => 
                    onConfigChange({
                      pageSettings: { ...config.pageSettings, applyToFirst: !!checked }
                    })
                  }
                />
                <Label htmlFor="apply-first" className="font-normal cursor-pointer">
                  仅首页
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-odd"
                  checked={config.pageSettings.applyToOdd}
                  onCheckedChange={(checked) => 
                    onConfigChange({
                      pageSettings: { ...config.pageSettings, applyToOdd: !!checked }
                    })
                  }
                />
                <Label htmlFor="apply-odd" className="font-normal cursor-pointer">
                  奇数页
                </Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="margin">页边距: {config.pageSettings.margin}px</Label>
            <Slider
              id="margin"
              min={0}
              max={50}
              step={5}
              value={[config.pageSettings.margin]}
              onValueChange={([value]) => 
                onConfigChange({
                  pageSettings: { ...config.pageSettings, margin: value }
                })
              }
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 pt-4 border-t">
        <Button variant="outline" className="flex-1">
          恢复默认
        </Button>
        <Button variant="default" className="flex-1">
          保存预设
        </Button>
      </div>
    </div>
  );
}
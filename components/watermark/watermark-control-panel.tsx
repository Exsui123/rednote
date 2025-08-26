'use client';

import { WatermarkConfig } from '@/lib/types/smart-watermark';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronUp, 
  ChevronDown, 
  Shield,
  FileDown,
  Code,
  TestTube,
  FileText
} from 'lucide-react';

interface WatermarkControlPanelProps {
  config: WatermarkConfig;
  onTechnologyChange: (tech: keyof WatermarkConfig['technologies'], value: any) => void;
  protectionScore: number;
}

export function WatermarkControlPanel({
  config,
  onTechnologyChange,
  protectionScore,
}: WatermarkControlPanelProps) {
  const handleCountChange = (tech: keyof WatermarkConfig['technologies'], delta: number) => {
    const currentCount = config.technologies[tech].count;
    const newCount = Math.max(0, Math.min(5, currentCount + delta));
    onTechnologyChange(tech, { count: newCount });
  };

  const getProtectionLevel = (score: number) => {
    if (score >= 85) return { text: '极高', color: 'text-green-600' };
    if (score >= 70) return { text: '高', color: 'text-green-500' };
    if (score >= 50) return { text: '中', color: 'text-yellow-500' };
    if (score >= 30) return { text: '低', color: 'text-orange-500' };
    return { text: '极低', color: 'text-red-500' };
  };

  const protectionLevel = getProtectionLevel(protectionScore);

  const calculateDensity = () => {
    const totalWatermarks = Object.values(config.technologies).reduce(
      (sum, t) => sum + (t.enabled ? t.count : 0),
      0
    );
    
    if (totalWatermarks <= 3) return '低';
    if (totalWatermarks <= 7) return '适中';
    if (totalWatermarks <= 12) return '高';
    return '极高';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Technology Selection */}
      <div className="space-y-4">
        <div className="font-semibold text-gray-800 border-b pb-2">
          🎯 技术组合选择
        </div>

        <div className="space-y-3">
          {/* Canvas */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tech-canvas"
                  checked={config.technologies.canvas.enabled}
                  onCheckedChange={(checked) =>
                    onTechnologyChange('canvas', { enabled: !!checked })
                  }
                />
                <Label htmlFor="tech-canvas" className="font-medium cursor-pointer">
                  Canvas 绘制
                </Label>
              </div>
            </div>
            {config.technologies.canvas.enabled && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">数量:</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('canvas', -1)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {config.technologies.canvas.count}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('canvas', 1)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">个</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">位置:</span>
                  <Select
                    value={config.technologies.canvas.position}
                    onValueChange={(value) =>
                      onTechnologyChange('canvas', { position: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagonal">对角线</SelectItem>
                      <SelectItem value="uniform">均匀分布</SelectItem>
                      <SelectItem value="center">中心区域</SelectItem>
                      <SelectItem value="corners">四角</SelectItem>
                      <SelectItem value="random">随机</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* SVG */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tech-svg"
                  checked={config.technologies.svg.enabled}
                  onCheckedChange={(checked) =>
                    onTechnologyChange('svg', { enabled: !!checked })
                  }
                />
                <Label htmlFor="tech-svg" className="font-medium cursor-pointer">
                  SVG 文字
                </Label>
              </div>
            </div>
            {config.technologies.svg.enabled && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">数量:</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('svg', -1)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {config.technologies.svg.count}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('svg', 1)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">个</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">位置:</span>
                  <Select
                    value={config.technologies.svg.position}
                    onValueChange={(value) =>
                      onTechnologyChange('svg', { position: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagonal">对角线</SelectItem>
                      <SelectItem value="uniform">均匀分布</SelectItem>
                      <SelectItem value="center">中心区域</SelectItem>
                      <SelectItem value="corners">四角</SelectItem>
                      <SelectItem value="random">随机</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* CSS Pseudo */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tech-csspeudo"
                  checked={config.technologies.csspeudo.enabled}
                  onCheckedChange={(checked) =>
                    onTechnologyChange('csspeudo', { enabled: !!checked })
                  }
                />
                <Label htmlFor="tech-csspeudo" className="font-medium cursor-pointer">
                  CSS 伪元素
                </Label>
              </div>
            </div>
            {config.technologies.csspeudo.enabled && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">数量:</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('csspeudo', -1)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {config.technologies.csspeudo.count}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('csspeudo', 1)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">个</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">位置:</span>
                  <Select
                    value={config.technologies.csspeudo.position}
                    onValueChange={(value) =>
                      onTechnologyChange('csspeudo', { position: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagonal">对角线</SelectItem>
                      <SelectItem value="uniform">均匀分布</SelectItem>
                      <SelectItem value="center">中心区域</SelectItem>
                      <SelectItem value="corners">四角</SelectItem>
                      <SelectItem value="random">随机</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Transform */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tech-transform"
                  checked={config.technologies.transform.enabled}
                  onCheckedChange={(checked) =>
                    onTechnologyChange('transform', { enabled: !!checked })
                  }
                />
                <Label htmlFor="tech-transform" className="font-medium cursor-pointer">
                  Transform 变形
                </Label>
              </div>
            </div>
            {config.technologies.transform.enabled && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">数量:</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('transform', -1)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {config.technologies.transform.count}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCountChange('transform', 1)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">个</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">角度:</span>
                  <Select
                    value={config.technologies.transform.rotation.toString()}
                    onValueChange={(value) =>
                      onTechnologyChange('transform', { rotation: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-45">-45°</SelectItem>
                      <SelectItem value="-30">-30°</SelectItem>
                      <SelectItem value="0">0°</SelectItem>
                      <SelectItem value="30">30°</SelectItem>
                      <SelectItem value="45">45°</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watermark Distribution Preview */}
      <div className="space-y-3">
        <div className="font-semibold text-gray-800 border-b pb-2">
          📊 水印分布预览
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-1 aspect-[3/4] max-w-[150px] mx-auto">
            {Array.from({ length: 9 }).map((_, i) => {
              const hasWatermark = i % 2 === 0 || i === 4;
              return (
                <div
                  key={i}
                  className={`rounded ${
                    hasWatermark ? 'bg-blue-400' : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </div>
          <div className="text-center mt-3 text-sm text-gray-600">
            当前密度: <span className="font-medium">{calculateDensity()}</span>
            <br />
            {Object.values(config.technologies).reduce(
              (sum, t) => sum + (t.enabled ? t.count : 0),
              0
            )} 个/页
          </div>
        </div>
      </div>

      {/* Protection Strength Analysis */}
      <div className="space-y-3">
        <div className="font-semibold text-gray-800 border-b pb-2 flex items-center justify-between">
          <span>🛡️ 防护强度分析</span>
          <Shield className={`h-5 w-5 ${protectionLevel.color}`} />
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>整体防护</span>
              <span className={`font-medium ${protectionLevel.color}`}>
                {protectionScore}% - {protectionLevel.text}
              </span>
            </div>
            <Progress value={protectionScore} className="h-2" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">抗CSS删除:</span>
              <Progress value={95} className="h-1.5 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">抗DOM操作:</span>
              <Progress value={88} className="h-1.5 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">抗图像处理:</span>
              <Progress value={75} className="h-1.5 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">抗OCR识别:</span>
              <Progress value={92} className="h-1.5 w-24" />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <TestTube className="h-4 w-4 mr-1" />
              测试去水印
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="h-4 w-4 mr-1" />
              查看报告
            </Button>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-3">
        <div className="font-semibold text-gray-800 border-b pb-2">
          💾 导出选项
        </div>
        
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">生成在线版本</div>
              <div className="text-xs text-gray-500">实时HTML+多层水印</div>
            </div>
          </Button>
          
          <Button variant="default" className="w-full justify-start">
            <FileDown className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">导出为PDF 🎯</div>
              <div className="text-xs text-gray-300">水印嵌入文档</div>
            </div>
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <FileDown className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">导出为图片</div>
              <div className="text-xs text-gray-500">PNG/JPG格式</div>
            </div>
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Code className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">复制防护代码</div>
              <div className="text-xs text-gray-500">集成到其他项目</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
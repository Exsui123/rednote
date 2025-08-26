'use client';

import { useEffect, useRef, useState } from 'react';
import { WatermarkConfig, LayerVisibility } from '@/lib/types/smart-watermark';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw 
} from 'lucide-react';

interface DocumentPreviewProps {
  config: WatermarkConfig;
  scale: number;
  showLayers: LayerVisibility;
  onScaleChange: (scale: number) => void;
  onLayerToggle: (layers: LayerVisibility) => void;
}

export function DocumentPreview({
  config,
  scale,
  showLayers,
  onScaleChange,
  onLayerToggle,
}: DocumentPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 595, height: 842 }); // A4 size

  // Canvas watermark rendering
  useEffect(() => {
    if (!canvasRef.current || !config.technologies.canvas.enabled || !showLayers.canvas) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.font = `${config.fontSize}px Arial`;
    ctx.fillStyle = config.color;
    ctx.globalAlpha = config.opacity;

    // Draw canvas watermarks based on position strategy
    const positions = getWatermarkPositions('canvas', config.technologies.canvas);
    positions.forEach(pos => {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      if (pos.rotation) {
        ctx.rotate((pos.rotation * Math.PI) / 180);
      }
      ctx.fillText(config.text, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }, [config, showLayers.canvas]);

  const getWatermarkPositions = (type: string, tech: any) => {
    const positions = [];
    const { count, position } = tech;
    
    switch (position) {
      case 'diagonal':
        for (let i = 0; i < count; i++) {
          positions.push({
            x: (dimensions.width / (count + 1)) * (i + 1),
            y: (dimensions.height / (count + 1)) * (i + 1),
            rotation: -45,
          });
        }
        break;
      case 'uniform':
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push({
            x: (dimensions.width / (cols + 1)) * (col + 1),
            y: (dimensions.height / (rows + 1)) * (row + 1),
            rotation: type === 'transform' ? tech.rotation : 0,
          });
        }
        break;
      case 'center':
        positions.push({
          x: dimensions.width / 2,
          y: dimensions.height / 2,
          rotation: type === 'transform' ? tech.rotation : 0,
        });
        if (count > 1) {
          for (let i = 1; i < count; i++) {
            const angle = (360 / (count - 1)) * i;
            const radius = 150;
            positions.push({
              x: dimensions.width / 2 + Math.cos((angle * Math.PI) / 180) * radius,
              y: dimensions.height / 2 + Math.sin((angle * Math.PI) / 180) * radius,
              rotation: type === 'transform' ? tech.rotation : 0,
            });
          }
        }
        break;
      default:
        break;
    }
    
    return positions;
  };

  const renderSVGWatermarks = () => {
    if (!config.technologies.svg.enabled || !showLayers.svg) return null;
    
    const positions = getWatermarkPositions('svg', config.technologies.svg);
    
    return (
      <svg 
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        {positions.map((pos, index) => (
          <text
            key={`svg-${index}`}
            x={pos.x}
            y={pos.y}
            fill={config.color}
            fontSize={config.fontSize}
            opacity={config.opacity}
            transform={pos.rotation ? `rotate(${pos.rotation} ${pos.x} ${pos.y})` : undefined}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {config.text}
          </text>
        ))}
      </svg>
    );
  };

  const renderCSSPseudoWatermarks = () => {
    if (!config.technologies.csspeudo.enabled || !showLayers.css) return null;
    
    const positions = getWatermarkPositions('csspeudo', config.technologies.csspeudo);
    
    return (
      <>
        {positions.map((pos, index) => (
          <div
            key={`css-${index}`}
            className="absolute pointer-events-none select-none"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) ${pos.rotation ? `rotate(${pos.rotation}deg)` : ''}`,
              color: config.color,
              fontSize: `${config.fontSize}px`,
              opacity: config.opacity,
            }}
          >
            {config.text}
          </div>
        ))}
      </>
    );
  };

  const renderTransformWatermarks = () => {
    if (!config.technologies.transform.enabled || !showLayers.all) return null;
    
    const positions = getWatermarkPositions('transform', config.technologies.transform);
    
    return (
      <>
        {positions.map((pos, index) => (
          <div
            key={`transform-${index}`}
            className="absolute pointer-events-none select-none"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) rotate(${config.technologies.transform.rotation}deg) skewX(-10deg)`,
              color: config.color,
              fontSize: `${config.fontSize}px`,
              opacity: config.opacity,
              fontStyle: 'italic',
            }}
          >
            {config.text}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center" ref={containerRef}>
        <div 
          className="bg-white shadow-2xl relative"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transform: `scale(${scale / 100})`,
            transformOrigin: 'center',
          }}
        >
          {/* Canvas Layer */}
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0 pointer-events-none"
            style={{ display: showLayers.canvas ? 'block' : 'none' }}
          />
          
          {/* SVG Layer */}
          {renderSVGWatermarks()}
          
          {/* CSS Pseudo Elements Layer */}
          {renderCSSPseudoWatermarks()}
          
          {/* Transform Layer */}
          {renderTransformWatermarks()}
          
          {/* Document Content */}
          <div className="p-12 relative z-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">示例文档</h1>
            <div className="space-y-4 text-gray-700">
              <p>
                这是一份演示文档，用于展示多层水印技术的防护效果。通过组合使用不同的水印实现技术，
                我们可以有效防止各种去水印工具的攻击。
              </p>
              <p>
                本系统采用了Canvas绘制、SVG矢量、CSS伪元素、Transform变形等多种技术，每种技术都有其独特的防护优势：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Canvas水印：难以通过CSS选择器删除</li>
                <li>SVG水印：抗图像处理算法</li>
                <li>CSS伪元素：难以通过DOM操作移除</li>
                <li>Transform变形：抗OCR识别</li>
              </ul>
              <p>
                通过智能分布算法，水印被合理地分散在页面的不同位置，既保证了文档的可读性，
                又提供了强大的防护能力。即使某种去水印技术能够移除特定类型的水印，
                其他类型的水印仍然能够保护文档的安全。
              </p>
              <p className="mt-6">
                这种多层防护策略特别适合以下场景：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>机密文件的在线预览</li>
                <li>版权内容的分享保护</li>
                <li>企业内部文档的安全管控</li>
                <li>敏感信息的追踪溯源</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t bg-white p-4 space-y-3">
        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">视图控制:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScaleChange(Math.max(25, scale - 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{scale}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onScaleChange(Math.min(200, scale + 25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onScaleChange(100)}>
              <RotateCcw className="h-4 w-4 mr-1" />
              实际大小
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4 mr-1" />
              适应宽度
            </Button>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">层级查看:</span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Checkbox
                id="show-all"
                checked={showLayers.all}
                onCheckedChange={(checked) => 
                  onLayerToggle({ ...showLayers, all: !!checked })
                }
              />
              <Label htmlFor="show-all" className="text-sm cursor-pointer">
                全部
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="show-canvas"
                checked={showLayers.canvas}
                onCheckedChange={(checked) => 
                  onLayerToggle({ ...showLayers, canvas: !!checked })
                }
              />
              <Label htmlFor="show-canvas" className="text-sm cursor-pointer">
                Canvas
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="show-svg"
                checked={showLayers.svg}
                onCheckedChange={(checked) => 
                  onLayerToggle({ ...showLayers, svg: !!checked })
                }
              />
              <Label htmlFor="show-svg" className="text-sm cursor-pointer">
                SVG
              </Label>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                id="show-css"
                checked={showLayers.css}
                onCheckedChange={(checked) => 
                  onLayerToggle({ ...showLayers, css: !!checked })
                }
              />
              <Label htmlFor="show-css" className="text-sm cursor-pointer">
                CSS
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
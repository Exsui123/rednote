'use client';

import { useState } from 'react';
import { ConfigPanel } from './config-panel';
import { DocumentPreview } from './document-preview';
import { WatermarkControlPanel } from './watermark-control-panel';
import { WatermarkConfig, WatermarkTechnology, ProtectionMode } from '@/lib/types/smart-watermark';

export function SmartWatermarkTool() {
  const [config, setConfig] = useState<WatermarkConfig>({
    text: '机密文件',
    fontSize: 48,
    opacity: 0.4,
    color: '#999999',
    protectionMode: 'smart',
    pageSettings: {
      applyToAll: true,
      applyToFirst: false,
      applyToOdd: false,
      margin: 20,
    },
    technologies: {
      canvas: { enabled: true, count: 2, position: 'diagonal' },
      svg: { enabled: true, count: 3, position: 'uniform' },
      csspeudo: { enabled: true, count: 2, position: 'center' },
      background: { enabled: false, count: 0, position: 'disabled' },
      shadow: { enabled: false, count: 0, position: 'disabled' },
      transform: { enabled: true, count: 2, rotation: -45 },
      blend: { enabled: false, count: 0, position: 'disabled' },
    },
  });

  const [previewScale, setPreviewScale] = useState(100);
  const [showLayers, setShowLayers] = useState({
    all: true,
    canvas: true,
    svg: true,
    css: true,
  });

  const handleConfigChange = (newConfig: Partial<WatermarkConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleTechnologyChange = (tech: keyof WatermarkConfig['technologies'], value: any) => {
    setConfig(prev => ({
      ...prev,
      technologies: {
        ...prev.technologies,
        [tech]: { ...prev.technologies[tech], ...value },
      },
    }));
  };

  const calculateProtectionScore = () => {
    const enabledTechs = Object.values(config.technologies).filter(t => t.enabled).length;
    const totalWatermarks = Object.values(config.technologies).reduce(
      (sum, t) => sum + (t.enabled ? t.count : 0),
      0
    );
    
    const techScore = (enabledTechs / 7) * 50;
    const densityScore = Math.min((totalWatermarks / 10) * 50, 50);
    
    return Math.round(techScore + densityScore);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🛡️</span>
          <h1 className="text-xl font-semibold text-gray-800">
            智能防护水印工具 - 多层防护技术
          </h1>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>防护等级: {calculateProtectionScore() > 80 ? '高' : calculateProtectionScore() > 50 ? '中' : '低'}</span>
          <span className="text-green-600">✅ 实时预览中</span>
        </div>
      </div>

      {/* Main Content - Three Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Config Panel */}
        <div className="w-[30%] bg-white border-r overflow-y-auto">
          <ConfigPanel 
            config={config} 
            onConfigChange={handleConfigChange} 
          />
        </div>

        {/* Middle Column - Document Preview */}
        <div className="w-[40%] bg-gray-50 flex flex-col">
          <DocumentPreview 
            config={config}
            scale={previewScale}
            showLayers={showLayers}
            onScaleChange={setPreviewScale}
            onLayerToggle={setShowLayers}
          />
        </div>

        {/* Right Column - Watermark Control */}
        <div className="w-[30%] bg-white border-l overflow-y-auto">
          <WatermarkControlPanel
            config={config}
            onTechnologyChange={handleTechnologyChange}
            protectionScore={calculateProtectionScore()}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-white px-6 py-2 text-sm flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>✅ 已选择 {Object.values(config.technologies).filter(t => t.enabled).length} 种技术</span>
          <span>共 {Object.values(config.technologies).reduce((sum, t) => sum + (t.enabled ? t.count : 0), 0)} 个水印</span>
          <span>防护等级: {calculateProtectionScore() > 80 ? '高' : calculateProtectionScore() > 50 ? '中' : '低'}</span>
        </div>
        <span className="text-gray-400">上次保存: 未保存</span>
      </div>
    </div>
  );
}
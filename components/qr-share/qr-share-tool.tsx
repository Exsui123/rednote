'use client';

import { useState, useCallback } from 'react';
import { ImageLibrary } from './image-library';
import { ShareSettings } from './share-settings';
import { QrCodeResult } from './qr-code-result';
import { Button } from '@/components/ui/button';
import { useImageShareStore } from '@/lib/stores/image-share-store';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ShareConfig {
  mode: 'single' | 'multiple'; // 单个二维码（打包）或多个二维码
  expiresIn: '1h' | '6h' | '24h' | '7d'; // 有效期
  password?: string; // 可选密码
}

export interface QrCodeData {
  id: string;
  qrCode: string; // base64 encoded QR code image
  url: string;
  imageIds: string[];
  expiresAt: Date;
}

export function QrShareTool() {
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    mode: 'single',
    expiresIn: '24h',
  });
  const [qrCodeData, setQrCodeData] = useState<QrCodeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const { images, getSelectedImages } = useImageShareStore();
  const selectedImages = getSelectedImages();

  const handleGenerateQrCode = useCallback(async () => {
    if (selectedImages.length === 0) return;

    setIsGenerating(true);
    
    // Simulate QR code generation (will be replaced with actual API call later)
    setTimeout(() => {
      // Mock QR code data
      const mockQrData: QrCodeData[] = [];
      
      if (shareConfig.mode === 'single') {
        // Generate single QR code for all images
        mockQrData.push({
          id: `qr_${Date.now()}`,
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          url: `https://share.example.com/s/${Math.random().toString(36).substr(2, 9)}`,
          imageIds: selectedImages.map(img => img.id),
          expiresAt: new Date(Date.now() + getExpirationMs(shareConfig.expiresIn)),
        });
      } else {
        // Generate individual QR codes for each image
        selectedImages.forEach((image) => {
          mockQrData.push({
            id: `qr_${image.id}`,
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            url: `https://share.example.com/i/${Math.random().toString(36).substr(2, 9)}`,
            imageIds: [image.id],
            expiresAt: new Date(Date.now() + getExpirationMs(shareConfig.expiresIn)),
          });
        });
      }
      
      setQrCodeData(mockQrData);
      setShowResult(true);
      setIsGenerating(false);
    }, 1500);
  }, [selectedImages, shareConfig]);

  const getExpirationMs = (expiresIn: string): number => {
    const map: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };
    return map[expiresIn] || map['24h'];
  };

  const handleBack = () => {
    setShowResult(false);
    setQrCodeData([]);
  };

  if (showResult) {
    return (
      <QrCodeResult
        qrCodeData={qrCodeData}
        shareConfig={shareConfig}
        selectedImages={selectedImages}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Library Section */}
      <ImageLibrary />

      {/* Alert when no images */}
      {images.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            暂无待分享的图片。从其他工具发送图片到这里，或点击"添加本地图片"上传。
          </AlertDescription>
        </Alert>
      )}

      {/* Share Settings Section */}
      {images.length > 0 && (
        <>
          <ShareSettings
            config={shareConfig}
            onConfigChange={setShareConfig}
          />

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleGenerateQrCode}
              disabled={selectedImages.length === 0 || isGenerating}
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  生成中...
                </>
              ) : (
                `生成二维码${selectedImages.length > 0 ? ` (${selectedImages.length}张)` : ''}`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
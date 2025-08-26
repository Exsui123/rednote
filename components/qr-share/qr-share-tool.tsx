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
    
    try {
      // 动态导入QRCode库
      const QRCode = (await import('qrcode')).default;
      const qrData: QrCodeData[] = [];
      
      if (shareConfig.mode === 'single') {
        // 批量分享：所有图片打包到一个QR码
        const imageData = selectedImages.map(img => ({
          src: img.src,
          fileName: img.fileName,
          toolName: img.toolName,
        }));
        
        // 将图片数据编码为Base64 JSON
        const jsonData = JSON.stringify(imageData);
        const encodedData = btoa(jsonData);
        const shareUrl = `${window.location.origin}/shared?data=${encodedData}`;
        
        // 生成真实的QR码
        const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        
        qrData.push({
          id: `qr_${Date.now()}`,
          qrCode: qrCodeDataUrl,
          url: shareUrl,
          imageIds: selectedImages.map(img => img.id),
          expiresAt: new Date(Date.now() + getExpirationMs(shareConfig.expiresIn)),
        });
      } else {
        // 单独分享：每个图片一个QR码
        for (const image of selectedImages) {
          const imageData = [{
            src: image.src,
            fileName: image.fileName,
            toolName: image.toolName,
          }];
          
          const jsonData = JSON.stringify(imageData);
          const encodedData = btoa(jsonData);
          const shareUrl = `${window.location.origin}/shared?data=${encodedData}`;
          
          // 生成真实的QR码
          const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          
          qrData.push({
            id: `qr_${image.id}`,
            qrCode: qrCodeDataUrl,
            url: shareUrl,
            imageIds: [image.id],
            expiresAt: new Date(Date.now() + getExpirationMs(shareConfig.expiresIn)),
          });
        }
      }
      
      setQrCodeData(qrData);
      setShowResult(true);
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
      // TODO: 显示错误提示
    } finally {
      setIsGenerating(false);
    }
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
            暂无待分享的图片。从其他工具发送图片到这里，或点击&ldquo;添加本地图片&rdquo;上传。
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
                `生成二维码${selectedImages.length > 0 ? ` &#40;${selectedImages.length}张&#41;` : ''}`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
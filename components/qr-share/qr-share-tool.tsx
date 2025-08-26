'use client';

import { useState, useCallback } from 'react';
import { ImageLibrary } from './image-library';
import { ShareSettings } from './share-settings';
import { QrCodeResult } from './qr-code-result';
import { Button } from '@/components/ui/button';
import { useImageShareStore } from '@/lib/stores/image-share-store';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 生成唯一的分享ID
const generateShareId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// 图片压缩函数
const compressImage = (dataUrl: string, quality: number = 0.7, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // 计算新尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制并压缩
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
};

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
        // 批量分享：生成一个唯一ID，通过ID访问数据
        const shareId = generateShareId();
        
        // 压缩图片数据
        const imageData = await Promise.all(selectedImages.map(async img => ({
          src: await compressImage(img.src, 0.4, 600), // 适度压缩，保持合理质量
          fileName: img.fileName,
          toolName: img.toolName,
        })));
        
        // 将数据存储到localStorage（临时方案，实际应用中应该使用服务器存储）
        const shareData = {
          images: imageData,
          expiresAt: Date.now() + getExpirationMs(shareConfig.expiresIn),
          password: shareConfig.password,
        };
        localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));
        
        // 生成简洁的分享URL
        const shareUrl = `${window.location.origin}/shared/${shareId}`;
        
        // 检查URL长度，确保QR码可以生成
        if (shareUrl.length > 2000) {
          throw new Error('分享链接过长，无法生成二维码');
        }
        
        // 生成QR码
        const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'M', // 使用中等纠错级别
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        
        qrData.push({
          id: shareId,
          qrCode: qrCodeDataUrl,
          url: shareUrl,
          imageIds: selectedImages.map(img => img.id),
          expiresAt: new Date(Date.now() + getExpirationMs(shareConfig.expiresIn)),
        });
      } else {
        // 单独分享：每个图片生成独立的分享ID
        for (const image of selectedImages) {
          const shareId = generateShareId();
          
          const imageData = [{
            src: await compressImage(image.src, 0.4, 600),
            fileName: image.fileName,
            toolName: image.toolName,
          }];
          
          const shareData = {
            images: imageData,
            expiresAt: Date.now() + getExpirationMs(shareConfig.expiresIn),
            password: shareConfig.password,
          };
          localStorage.setItem(`share_${shareId}`, JSON.stringify(shareData));
          
          const shareUrl = `${window.location.origin}/shared/${shareId}`;
          
          if (shareUrl.length > 2000) {
            throw new Error('分享链接过长，无法生成二维码');
          }
          
          const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          
          qrData.push({
            id: shareId,
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
      alert(`生成二维码失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
                `生成二维码${selectedImages.length > 0 ? ` (${selectedImages.length}张)` : ''}`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
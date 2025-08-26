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
        // 批量分享：极度压缩图片数据并编码到URL
        const imageData = await Promise.all(selectedImages.map(async img => ({
          src: await compressImage(img.src, 0.08, 200), // 超级压缩：8%质量，200px宽度
          fileName: img.fileName || 'image',
          toolName: img.toolName || 'tool',
        })));
        
        // 尝试生成分享数据
        const shareData = {
          images: imageData,
          exp: Date.now() + getExpirationMs(shareConfig.expiresIn),
          pwd: shareConfig.password,
        };
        
        // 压缩JSON并编码
        const jsonData = JSON.stringify(shareData);
        let encodedData: string;
        
        try {
          // 尝试使用压缩
          const pako = await import('pako');
          const compressed = pako.deflate(jsonData, { level: 9 });
          const compressedBase64 = btoa(String.fromCharCode(...compressed));
          encodedData = `c_${compressedBase64}`; // c_ 前缀表示压缩数据
        } catch {
          // 压缩失败，使用普通base64编码
          const base64Data = btoa(encodeURIComponent(jsonData).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
          encodedData = `b_${base64Data}`; // b_ 前缀表示base64数据
        }
        
        const shareUrl = `${window.location.origin}/shared?d=${encodedData}`;
        
        // 检查数据大小
        if (shareUrl.length > 2500) {
          throw new Error(`数据量过大(${shareUrl.length}字符)，建议：\n1. 减少图片数量\n2. 使用"每张图片单独"模式\n3. 选择尺寸较小的图片`);
        }
        
        // 生成QR码
        const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
          width: 300,
          margin: 1, // 减小边距
          errorCorrectionLevel: 'L', // 使用最低纠错级别节省空间
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
            src: await compressImage(image.src, 0.08, 200),
            fileName: image.fileName || 'image',
            toolName: image.toolName || 'tool',
          }];
          
          const shareData = {
            images: imageData,
            exp: Date.now() + getExpirationMs(shareConfig.expiresIn),
            pwd: shareConfig.password,
          };
          
          const jsonData = JSON.stringify(shareData);
          let encodedData: string;
          
          try {
            const pako = await import('pako');
            const compressed = pako.deflate(jsonData, { level: 9 });
            const compressedBase64 = btoa(String.fromCharCode(...compressed));
            encodedData = `c_${compressedBase64}`;
          } catch {
            const base64Data = btoa(encodeURIComponent(jsonData).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
            encodedData = `b_${base64Data}`;
          }
          
          const shareUrl = `${window.location.origin}/shared?d=${encodedData}`;
          
          if (shareUrl.length > 2500) {
            throw new Error(`图片 "${image.fileName}" 数据量过大，无法生成二维码`);
          }
          
          const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
            width: 300,
            margin: 1,
            errorCorrectionLevel: 'L',
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
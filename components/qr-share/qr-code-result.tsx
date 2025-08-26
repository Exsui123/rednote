'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareConfig, QrCodeData } from './qr-share-tool';
import { SharedImage } from '@/lib/stores/image-share-store';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Check,
  RefreshCw,
  ExternalLink,
  Package,
  Grid,
  Clock,
  Link2
} from 'lucide-react';
import Image from 'next/image';
import QRCode from 'qrcode';

interface QrCodeResultProps {
  qrCodeData: QrCodeData[];
  shareConfig: ShareConfig;
  selectedImages: SharedImage[];
  onBack: () => void;
}

export function QrCodeResult({
  qrCodeData,
  shareConfig,
  selectedImages,
  onBack,
}: QrCodeResultProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedQrCodes, setGeneratedQrCodes] = useState<Map<string, string>>(new Map());

  // Generate real QR codes on mount
  useEffect(() => {
    const generateQrCodes = async () => {
      const codes = new Map<string, string>();
      
      for (const data of qrCodeData) {
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(data.url, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          codes.set(data.id, qrCodeDataUrl);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
      
      setGeneratedQrCodes(codes);
    };

    generateQrCodes();
  }, [qrCodeData]);

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadQrCode = (qrCode: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllQrCodes = () => {
    qrCodeData.forEach((data, index) => {
      const qrCode = generatedQrCodes.get(data.id);
      if (qrCode) {
        setTimeout(() => {
          handleDownloadQrCode(qrCode, `qrcode_${index + 1}.png`);
        }, index * 100); // Stagger downloads
      }
    });
  };

  const formatExpiresAt = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const isSingleMode = shareConfig.mode === 'single';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <h2 className="text-2xl font-bold">分享二维码已生成</h2>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          重新生成
        </Button>
      </div>

      {/* Single QR Code Mode */}
      {isSingleMode && qrCodeData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Package className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">批量分享链接</h3>
              <p className="text-sm text-gray-600">
                扫码访问该链接可查看并下载所有 {selectedImages.length} 张图片
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                {generatedQrCodes.get(qrCodeData[0].id) ? (
                  <Image
                    src={generatedQrCodes.get(qrCodeData[0].id)!}
                    alt="QR Code"
                    width={256}
                    height={256}
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 animate-pulse rounded" />
                )}
              </div>
              <Button
                onClick={() => handleDownloadQrCode(
                  generatedQrCodes.get(qrCodeData[0].id) || '',
                  'share_qrcode.png'
                )}
                disabled={!generatedQrCodes.has(qrCodeData[0].id)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                下载二维码
              </Button>
            </div>

            {/* Share Info */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1">分享链接</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={qrCodeData[0].url}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(qrCodeData[0].url, qrCodeData[0].id)}
                  >
                    {copiedId === qrCodeData[0].id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(qrCodeData[0].url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">
                    包含 {selectedImages.length} 张图片
                  </Badge>
                  {shareConfig.password && (
                    <Badge variant="outline">
                      <Lock className="h-3 w-3 mr-1" />
                      已加密
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  有效期至：{formatExpiresAt(qrCodeData[0].expiresAt)}
                </div>
              </div>

              {/* Preview Images */}
              <div>
                <Label className="text-sm text-gray-600 mb-2">包含的图片</Label>
                <div className="grid grid-cols-4 gap-2">
                  {selectedImages.slice(0, 8).map((image) => (
                    <div key={image.id} className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                      {image.src.startsWith('data:image') && (
                        <Image
                          src={image.src}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {selectedImages.length > 8 && (
                    <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-sm text-gray-600">
                        +{selectedImages.length - 8}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Multiple QR Codes Mode */}
      {!isSingleMode && qrCodeData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <Grid className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-1">独立分享链接</h3>
                <p className="text-sm text-gray-600">
                  每张图片都有独立的二维码和链接，可分别分享
                </p>
              </div>
            </div>
            <Button
              onClick={handleDownloadAllQrCodes}
              disabled={generatedQrCodes.size === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              批量下载所有二维码
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {qrCodeData.map((data, index) => {
              const image = selectedImages.find(img => 
                data.imageIds.includes(img.id)
              );
              if (!image) return null;

              return (
                <div key={data.id} className="border rounded-lg p-3 space-y-2">
                  {/* Image Preview */}
                  <div className="aspect-square relative bg-gray-100 rounded overflow-hidden mb-2">
                    {image.src.startsWith('data:image') && (
                      <Image
                        src={image.src}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-2 rounded border">
                    {generatedQrCodes.get(data.id) ? (
                      <Image
                        src={generatedQrCodes.get(data.id)!}
                        alt={`QR Code ${index + 1}`}
                        width={128}
                        height={128}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="aspect-square bg-gray-100 animate-pulse rounded" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyLink(data.url, data.id)}
                    >
                      {copiedId === data.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadQrCode(
                        generatedQrCodes.get(data.id) || '',
                        `qrcode_${index + 1}.png`
                      )}
                      disabled={!generatedQrCodes.has(data.id)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Image Info */}
                  <div className="text-xs text-gray-600 truncate">
                    {image.fileName || `图片 ${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span>📱</span> 使用说明
        </h3>
        <ol className="space-y-1 text-sm text-gray-700">
          <li>1. 使用手机扫描上方二维码，或复制链接在手机浏览器打开</li>
          <li>2. 页面会自动适配手机屏幕，展示所有分享的图片</li>
          <li>3. 长按图片可保存到手机相册，或点击批量下载按钮</li>
          {shareConfig.password && (
            <li>4. 访问时需要输入密码：<code className="bg-white px-1 rounded">{shareConfig.password}</code></li>
          )}
        </ol>
      </Card>
    </div>
  );
}

// Add missing imports
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
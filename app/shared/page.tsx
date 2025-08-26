'use client';

import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, ArrowLeft, Share } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

interface SharedImage {
  src: string;
  fileName?: string;
  toolName?: string;
}

function SharedPageContent() {
  const searchParams = useSearchParams();
  const [images, setImages] = useState<SharedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从URL参数中解析图片数据
    const data = searchParams.get('data');
    if (data) {
      try {
        // 解码Base64编码的JSON数据
        const decodedData = atob(data);
        const parsedImages = JSON.parse(decodedData);
        setImages(parsedImages);
      } catch (error) {
        console.error('Failed to parse image data:', error);
      }
    }
    setLoading(false);
  }, [searchParams]);

  const handleDownload = async (imageSrc: string, fileName: string = 'image') => {
    try {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = fileName.includes('.') ? fileName : `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async (imageSrc: string) => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.canShare) {
      try {
        // 将base64转换为blob
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const file = new File([blob], 'shared-image.png', { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: '分享图片',
          });
        }
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">未找到图片</h1>
          <p className="text-gray-600 mb-6">
            分享链接可能已过期或数据有误
          </p>
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              分享的图片 ({images.length})
            </h1>
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {images.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              {/* Image Display */}
              <div className="relative bg-white">
                <Image
                  src={image.src}
                  alt={image.fileName || `图片 ${index + 1}`}
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain max-h-96"
                  priority={index === 0}
                />
              </div>
              
              {/* Image Info & Actions */}
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-800 truncate">
                      {image.fileName || `图片 ${index + 1}`}
                    </h3>
                    {image.toolName && (
                      <p className="text-sm text-gray-500">
                        来源: {image.toolName}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(image.src, image.fileName)}
                    className="flex-1"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    保存到手机
                  </Button>
                  
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button
                      onClick={() => handleShare(image.src)}
                      variant="outline"
                      size="sm"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            长按图片也可以保存到手机相册
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

export default function SharedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SharedPageContent />
    </Suspense>
  );
}
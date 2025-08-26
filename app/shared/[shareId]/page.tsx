'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, ArrowLeft, Share, Lock } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

interface SharedImage {
  src: string;
  fileName?: string;
  toolName?: string;
}

interface ShareData {
  images: SharedImage[];
  expiresAt: number;
  password?: string;
}

export default function SharedPageWithId() {
  const params = useParams();
  const shareId = params.shareId as string;
  
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState('');
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!shareId) return;
    
    try {
      // 从localStorage获取分享数据
      const storedData = localStorage.getItem(`share_${shareId}`);
      
      if (!storedData) {
        setError('分享链接不存在或已过期');
        setLoading(false);
        return;
      }
      
      const data: ShareData = JSON.parse(storedData);
      
      // 检查是否过期
      if (Date.now() > data.expiresAt) {
        setError('分享链接已过期');
        // 清理过期数据
        localStorage.removeItem(`share_${shareId}`);
        setLoading(false);
        return;
      }
      
      // 检查是否需要密码
      if (data.password && !password) {
        setIsPasswordRequired(true);
        setLoading(false);
        return;
      }
      
      // 验证密码
      if (data.password && password !== data.password) {
        setPasswordError('密码错误');
        setLoading(false);
        return;
      }
      
      setShareData(data);
      setIsPasswordRequired(false);
      setPasswordError('');
      setLoading(false);
    } catch (error) {
      console.error('Failed to load share data:', error);
      setError('数据解析失败');
      setLoading(false);
    }
  }, [shareId, password]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');
    // 触发useEffect重新验证密码
    setTimeout(() => setLoading(false), 100);
  };

  const handleDownload = async (imageSrc: string, fileName: string = 'image') => {
    try {
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

  const handleDownloadAll = () => {
    if (!shareData) return;
    
    shareData.images.forEach((image, index) => {
      setTimeout(() => {
        handleDownload(image.src, image.fileName || `image_${index + 1}`);
      }, index * 200); // 延迟下载避免浏览器阻止
    });
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">无法访问</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (isPasswordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">需要密码</h1>
            <p className="text-gray-600">
              此分享内容需要输入密码才能查看
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="请输入访问密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={!password.trim()}>
              访问内容
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!shareData || shareData.images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">未找到图片</h1>
          <p className="text-gray-600 mb-6">分享内容为空或数据有误</p>
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

  const { images } = shareData;
  const expiresDate = new Date(shareData.expiresAt);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">
              分享的图片 ({images.length})
            </h1>
            <div className="flex gap-2">
              {images.length > 1 && (
                <Button onClick={handleDownloadAll} size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  全部保存
                </Button>
              )}
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
          
          {/* Expiry Info */}
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              链接有效期至: {expiresDate.toLocaleString('zh-CN')}
            </p>
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
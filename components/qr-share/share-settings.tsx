'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ShareConfig } from './qr-share-tool';
import { Settings, Clock, Lock, Package, Grid } from 'lucide-react';
import { useState } from 'react';

interface ShareSettingsProps {
  config: ShareConfig;
  onConfigChange: (config: ShareConfig) => void;
}

export function ShareSettings({ config, onConfigChange }: ShareSettingsProps) {
  const [enablePassword, setEnablePassword] = useState(false);

  const handleModeChange = (mode: string) => {
    onConfigChange({
      ...config,
      mode: mode as 'single' | 'multiple',
    });
  };

  const handleExpiresInChange = (expiresIn: string) => {
    onConfigChange({
      ...config,
      expiresIn: expiresIn as '1h' | '6h' | '24h' | '7d',
    });
  };

  const handlePasswordChange = (password: string) => {
    onConfigChange({
      ...config,
      password: password || undefined,
    });
  };

  const handlePasswordToggle = (enabled: boolean) => {
    setEnablePassword(enabled);
    if (!enabled) {
      onConfigChange({
        ...config,
        password: undefined,
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-semibold">分享设置</h2>
      </div>

      <div className="space-y-6">
        {/* Share Mode */}
        <div className="space-y-3">
          <Label className="text-base">分享方式</Label>
          <RadioGroup
            value={config.mode}
            onValueChange={handleModeChange}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-start space-x-3 cursor-pointer">
              <RadioGroupItem value="single" id="single" className="mt-1" />
              <Label
                htmlFor="single"
                className="cursor-pointer flex-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">生成单个二维码</span>
                </div>
                <p className="text-sm text-gray-600">
                  所有图片打包在一个分享链接中，扫码后可批量下载
                </p>
              </Label>
            </div>
            <div className="flex items-start space-x-3 cursor-pointer">
              <RadioGroupItem value="multiple" id="multiple" className="mt-1" />
              <Label
                htmlFor="multiple"
                className="cursor-pointer flex-1"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Grid className="h-4 w-4" />
                  <span className="font-medium">每张图片单独二维码</span>
                </div>
                <p className="text-sm text-gray-600">
                  每张图片生成独立的二维码，可分别分享给不同的人
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Expiration Time */}
        <div className="space-y-2">
          <Label htmlFor="expires" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            有效期
          </Label>
          <Select
            value={config.expiresIn}
            onValueChange={handleExpiresInChange}
          >
            <SelectTrigger id="expires" className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1小时</SelectItem>
              <SelectItem value="6h">6小时</SelectItem>
              <SelectItem value="24h">24小时</SelectItem>
              <SelectItem value="7d">7天</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600">
            链接过期后将自动失效，图片会被清理
          </p>
        </div>

        {/* Password Protection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="password-toggle" className="flex items-center gap-2 cursor-pointer">
              <Lock className="h-4 w-4" />
              密码保护
            </Label>
            <Switch
              id="password-toggle"
              checked={enablePassword}
              onCheckedChange={handlePasswordToggle}
            />
          </div>
          {enablePassword && (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="输入访问密码"
                value={config.password || ''}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full md:w-64"
              />
              <p className="text-sm text-gray-600">
                扫码后需要输入密码才能查看图片
              </p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t">
          <div className="flex items-start gap-2">
            <div className="mt-1">ℹ️</div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 生成的二维码可以保存为图片分享给他人</p>
              <p>• 手机扫码后可直接查看和保存图片到相册</p>
              <p>• 分享链接支持在任何浏览器中打开</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
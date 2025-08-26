'use client';

import { useState } from 'react';
import { QrShareTool } from '@/components/qr-share/qr-share-tool';

export default function QrSharePage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">二维码分享工具</h1>
        <p className="text-gray-600">
          收集来自各工具的图片，生成二维码分享给手机端保存
        </p>
      </div>
      <QrShareTool />
    </div>
  );
}
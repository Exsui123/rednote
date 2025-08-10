// FFmpeg转场效果配置
export interface TransitionConfig {
  id: string
  name: string
  ffmpegFilter: string
  xfadeType?: string
  duration: number
}

// 支持的转场效果列表
export const transitions: Record<string, TransitionConfig> = {
  fade: {
    id: 'fade',
    name: '淡入淡出',
    ffmpegFilter: 'fade',
    xfadeType: 'fade',
    duration: 1
  },
  dissolve: {
    id: 'dissolve',
    name: '交叉溶解',
    ffmpegFilter: 'dissolve',
    xfadeType: 'dissolve',
    duration: 1
  },
  
  // 滑动效果
  slideLeft: {
    id: 'slideLeft',
    name: '左滑',
    ffmpegFilter: 'slideleft',
    xfadeType: 'slideleft',
    duration: 1
  },
  slideRight: {
    id: 'slideRight',
    name: '右滑',
    ffmpegFilter: 'slideright',
    xfadeType: 'slideright',
    duration: 1
  },
  slideUp: {
    id: 'slideUp',
    name: '上滑',
    ffmpegFilter: 'slideup',
    xfadeType: 'slideup',
    duration: 1
  },
  slideDown: {
    id: 'slideDown',
    name: '下滑',
    ffmpegFilter: 'slidedown',
    xfadeType: 'slidedown',
    duration: 1
  },
  
  // 擦除效果
  wipeLeft: {
    id: 'wipeLeft',
    name: '左擦除',
    ffmpegFilter: 'wipeleft',
    xfadeType: 'wipeleft',
    duration: 1
  },
  wipeRight: {
    id: 'wipeRight',
    name: '右擦除',
    ffmpegFilter: 'wiperight',
    xfadeType: 'wiperight',
    duration: 1
  },
  wipeUp: {
    id: 'wipeUp',
    name: '上擦除',
    ffmpegFilter: 'wipeup',
    xfadeType: 'wipeup',
    duration: 1
  },
  wipeDown: {
    id: 'wipeDown',
    name: '下擦除',
    ffmpegFilter: 'wipedown',
    xfadeType: 'wipedown',
    duration: 1
  },
  
  // 缩放效果
  zoomIn: {
    id: 'zoomIn',
    name: '放大',
    ffmpegFilter: 'zoomin',
    xfadeType: 'zoomin',
    duration: 1
  },
  zoomOut: {
    id: 'zoomOut',
    name: '缩小',
    ffmpegFilter: 'zoomout',
    xfadeType: 'zoomout',
    duration: 1
  },
  
  // 旋转效果
  circleOpen: {
    id: 'circleOpen',
    name: '圆形展开',
    ffmpegFilter: 'circleopen',
    xfadeType: 'circleopen',
    duration: 1
  },
  circleClose: {
    id: 'circleClose',
    name: '圆形关闭',
    ffmpegFilter: 'circleclose',
    xfadeType: 'circleclose',
    duration: 1
  },
  
  // 翻页效果
  vertOpen: {
    id: 'vertOpen',
    name: '垂直翻开',
    ffmpegFilter: 'vertopen',
    xfadeType: 'vertopen',
    duration: 1
  },
  vertClose: {
    id: 'vertClose',
    name: '垂直合上',
    ffmpegFilter: 'vertclose',
    xfadeType: 'vertclose',
    duration: 1
  },
  horzOpen: {
    id: 'horzOpen',
    name: '水平翻开',
    ffmpegFilter: 'horzopen',
    xfadeType: 'horzopen',
    duration: 1
  },
  horzClose: {
    id: 'horzClose',
    name: '水平合上',
    ffmpegFilter: 'horzclose',
    xfadeType: 'horzclose',
    duration: 1
  },
  
  // 特殊效果
  radial: {
    id: 'radial',
    name: '径向',
    ffmpegFilter: 'radial',
    xfadeType: 'radial',
    duration: 1
  },
  smoothLeft: {
    id: 'smoothLeft',
    name: '平滑左移',
    ffmpegFilter: 'smoothleft',
    xfadeType: 'smoothleft',
    duration: 1
  },
  smoothRight: {
    id: 'smoothRight',
    name: '平滑右移',
    ffmpegFilter: 'smoothright',
    xfadeType: 'smoothright',
    duration: 1
  },
  smoothUp: {
    id: 'smoothUp',
    name: '平滑上移',
    ffmpegFilter: 'smoothup',
    xfadeType: 'smoothup',
    duration: 1
  },
  smoothDown: {
    id: 'smoothDown',
    name: '平滑下移',
    ffmpegFilter: 'smoothdown',
    xfadeType: 'smoothdown',
    duration: 1
  },
  
  // 像素化效果
  pixelize: {
    id: 'pixelize',
    name: '像素化',
    ffmpegFilter: 'pixelize',
    xfadeType: 'pixelize',
    duration: 1
  },
  
  // 对角线效果
  diagTL: {
    id: 'diagTL',
    name: '左上对角线',
    ffmpegFilter: 'diagtl',
    xfadeType: 'diagtl',
    duration: 1
  },
  diagTR: {
    id: 'diagTR',
    name: '右上对角线',
    ffmpegFilter: 'diagtr',
    xfadeType: 'diagtr',
    duration: 1
  },
  diagBL: {
    id: 'diagBL',
    name: '左下对角线',
    ffmpegFilter: 'diagbl',
    xfadeType: 'diagbl',
    duration: 1
  },
  diagBR: {
    id: 'diagBR',
    name: '右下对角线',
    ffmpegFilter: 'diagbr',
    xfadeType: 'diagbr',
    duration: 1
  }
}

// 获取转场的FFmpeg命令
export function getTransitionCommand(
  transitionId: string,
  duration: number = 1
): string {
  const transition = transitions[transitionId] || transitions.fade
  return transition.xfadeType || transition.ffmpegFilter
}

// 获取所有可用的转场效果
export function getAvailableTransitions() {
  return Object.values(transitions).map(t => ({
    id: t.id,
    name: t.name,
    value: t.id
  }))
}
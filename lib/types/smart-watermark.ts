export type ProtectionMode = 'smart' | 'heavy' | 'light' | 'custom';

export type WatermarkPosition = 'diagonal' | 'uniform' | 'center' | 'corners' | 'random' | 'disabled';

export interface WatermarkTechnology {
  enabled: boolean;
  count: number;
  position?: WatermarkPosition;
  rotation?: number;
}

export interface WatermarkConfig {
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  protectionMode: ProtectionMode;
  pageSettings: {
    applyToAll: boolean;
    applyToFirst: boolean;
    applyToOdd: boolean;
    margin: number;
  };
  technologies: {
    canvas: WatermarkTechnology;
    svg: WatermarkTechnology;
    csspeudo: WatermarkTechnology;
    background: WatermarkTechnology;
    shadow: WatermarkTechnology;
    transform: WatermarkTechnology & { rotation: number };
    blend: WatermarkTechnology;
  };
}

export interface LayerVisibility {
  all: boolean;
  canvas: boolean;
  svg: boolean;
  css: boolean;
}
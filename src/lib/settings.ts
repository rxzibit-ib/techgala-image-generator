// 管理者が設定する画像とレイアウト情報を管理

export interface ImageSettings {
  backgroundUrl: string | null;
  overlayUrl: string | null;
  userImageArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  outputWidth: number;
  outputHeight: number;
}

export const defaultSettings: ImageSettings = {
  backgroundUrl: null,
  overlayUrl: null,
  userImageArea: {
    x: 100,
    y: 150,
    width: 1000,
    height: 1000,
  },
  outputWidth: 1200,
  outputHeight: 1500,
};

// ローカルストレージキー（開発用）
export const SETTINGS_KEY = "techgala_image_settings";


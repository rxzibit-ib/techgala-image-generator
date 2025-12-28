"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageSettings {
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

export default function Home() {
  const [settings, setSettings] = useState<ImageSettings | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 設定を取得
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => setError("設定の読み込みに失敗しました"));
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUserImage(e.target?.result as string);
      setPreviewUrl(e.target?.result as string);
      setGeneratedImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleGenerate = async () => {
    if (!userImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImage }),
      });

      if (!response.ok) {
        throw new Error("画像生成に失敗しました");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedImage(url);
    } catch {
      setError("画像の生成中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = "techgala_image.jpg";
    link.click();
  };

  const shareText = encodeURIComponent("TechGALAに参加します！#TechGALA");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = (platform: string) => {
    if (!generatedImage) return;

    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${shareText}`;
        break;
    }
    if (url) window.open(url, "_blank", "width=600,height=400");
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 animate-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
            TechGALA
          </h1>
          <p className="text-lg text-gray-400">
            あなたの写真でオリジナル画像を作成しよう
          </p>
        </header>

        {error && (
          <div className="card p-4 mb-6 border-red-500 text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* アップロードエリア */}
          <div className="card p-6 animate-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold mb-4">📷 画像をアップロード</h2>
            
            <div
              className={`drop-zone ${isDragOver ? "dragover" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div>
                  <div className="text-5xl mb-4">📸</div>
                  <p className="text-gray-400 mb-2">
                    クリックまたはドラッグ&ドロップ
                  </p>
                  <p className="text-sm text-gray-500">
                    1000×1000pxにクロップされます
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {previewUrl && (
              <button
                onClick={() => {
                  setUserImage(null);
                  setPreviewUrl(null);
                  setGeneratedImage(null);
                }}
                className="w-full mt-4 btn-secondary"
              >
                画像を変更
              </button>
            )}
          </div>

          {/* 結果エリア */}
          <div className="card p-6 animate-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-semibold mb-4">✨ 生成結果</h2>

            {generatedImage ? (
              <div>
                <img
                  src={generatedImage}
                  alt="生成された画像"
                  className="w-full rounded-lg shadow-lg mb-4"
                />

                <button onClick={handleDownload} className="w-full btn-primary mb-4">
                  💾 ダウンロード
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShare("twitter")}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X (Twitter)
                  </button>
                  <button
                    onClick={() => handleShare("facebook")}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>
            ) : (
              <div className="preview-canvas aspect-[4/5] flex items-center justify-center">
                {userImage ? (
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={`btn-primary pulse-glow ${isLoading ? "opacity-50" : ""}`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        生成中...
                      </span>
                    ) : (
                      "🎨 画像を生成"
                    )}
                  </button>
                ) : (
                  <p className="text-gray-500">画像をアップロードしてください</p>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>© 2025 TechGALA</p>
        </footer>
      </div>
    </main>
  );
}

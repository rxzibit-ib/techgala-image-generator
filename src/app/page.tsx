"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";

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

// 画像を圧縮・リサイズする関数
const compressImage = (file: File | Blob, maxSize: number = 1500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // 最大サイズにリサイズ
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG形式で圧縮（品質80%）
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = url;
  });
};

export default function Home() {
  const [settings, setSettings] = useState<ImageSettings | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 設定を取得
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => setError("設定の読み込みに失敗しました"));

    // Web Share APIが使えるかチェック
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    // HEIC/HEIFを含む画像ファイルを許可
    const isImage = file.type.startsWith("image/") || 
                    file.name.toLowerCase().endsWith(".heic") || 
                    file.name.toLowerCase().endsWith(".heif");
    
    if (!isImage) {
      setError("画像ファイルを選択してください");
      return;
    }

    setError(null);
    setGeneratedImage(null);
    setGeneratedBlob(null);
    setIsConverting(true);

    try {
      // HEIC/HEIFの場合はサーバーで変換
      if (file.name.toLowerCase().endsWith(".heic") || 
          file.name.toLowerCase().endsWith(".heif") ||
          file.type === "image/heic" ||
          file.type === "image/heif") {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/convert-heic", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("HEIC変換に失敗しました");
        }

        const data = await response.json();
        // 変換後の画像をさらに圧縮
        const blob = await fetch(data.base64).then(r => r.blob());
        const compressed = await compressImage(blob, 1500);
        setUserImage(compressed);
        setPreviewUrl(compressed);
      } else {
        // 通常の画像は圧縮してからセット
        const compressed = await compressImage(file, 1500);
        setUserImage(compressed);
        setPreviewUrl(compressed);
      }
    } catch (err) {
      console.error("Image processing error:", err);
      setError("画像の処理に失敗しました。別の画像をお試しください。");
    } finally {
      setIsConverting(false);
    }
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "画像生成に失敗しました");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedImage(url);
      setGeneratedBlob(blob);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "画像の生成中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage || !generatedBlob) return;

    // Web Share APIが使える場合（主にiPhone）は共有メニューを表示
    if (canShare && navigator.canShare) {
      try {
        const file = new File([generatedBlob], "techgala_image.jpg", { type: "image/jpeg" });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "TechGALA",
          });
          return;
        }
      } catch (err) {
        // ユーザーがキャンセルした場合は何もしない
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // 共有に失敗した場合は通常のダウンロードにフォールバック
      }
    }

    // 通常のダウンロード
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
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="TechGALA"
              width={280}
              height={80}
              className="h-16 md:h-20 w-auto"
              priority
            />
          </div>
          <p className="text-lg text-gray-400">
            TechGALAに参加する気持ちを発信しよう！
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
              {isConverting ? (
                <div className="text-center">
                  <div className="animate-spin w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">画像を処理中...</p>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div>
                  <div className="text-5xl mb-4">📸</div>
                  <p className="text-gray-400 mb-2">
                    タップして写真を選択
                  </p>
                  <p className="text-sm text-gray-500">
                    HEIC・JPG・PNG対応
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {previewUrl && !isConverting && (
              <button
                onClick={() => {
                  setUserImage(null);
                  setPreviewUrl(null);
                  setGeneratedImage(null);
                  setGeneratedBlob(null);
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
                  📲 {canShare ? "写真を保存" : "ダウンロード"}
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

"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

interface Settings {
  backgroundUrl: string | null;
  overlayUrl: string | null;
  userImageArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings>({
    backgroundUrl: null,
    overlayUrl: null,
    userImageArea: { x: 100, y: 150, width: 1000, height: 1000 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleImageUpload = async (type: "background" | "overlay", file: File) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("アップロードに失敗しました");

      const data = await response.json();
      setSettings((prev) => ({
        ...prev,
        [type === "background" ? "backgroundUrl" : "overlayUrl"]: data.url,
      }));
      setMessage({ type: "success", text: `${type === "background" ? "背景" : "装飾"}画像をアップロードしました` });
    } catch {
      setMessage({ type: "error", text: "アップロードに失敗しました" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePosition = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userImageArea: settings.userImageArea }),
      });

      if (!response.ok) throw new Error("保存に失敗しました");

      setMessage({ type: "success", text: "配置設定を保存しました" });
    } catch {
      setMessage({ type: "error", text: "配置設定の保存に失敗しました" });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePosition = (key: keyof Settings["userImageArea"], value: number) => {
    setSettings((prev) => ({
      ...prev,
      userImageArea: { ...prev.userImageArea, [key]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">⚙️ 管理画面</h1>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary text-sm">
            ログアウト
          </button>
        </header>

        {message && (
          <div
            className={`card p-4 mb-6 ${
              message.type === "success"
                ? "border-green-500 text-green-400"
                : "border-red-500 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 画像アップロード */}
          <div className="space-y-6">
            {/* 背景画像 */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">🖼️ 背景画像（レイヤー1）</h2>
              <p className="text-sm text-gray-400 mb-4">推奨サイズ: 1200×1500px</p>

              {settings.backgroundUrl && (
                <img
                  src={settings.backgroundUrl}
                  alt="背景"
                  className="w-full max-h-48 object-contain mb-4 rounded-lg bg-gray-800"
                />
              )}

              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("background", file);
                }}
              />
              <button
                onClick={() => backgroundInputRef.current?.click()}
                disabled={isSaving}
                className="w-full btn-primary"
              >
                {settings.backgroundUrl ? "背景を変更" : "背景をアップロード"}
              </button>
            </div>

            {/* 装飾画像 */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">✨ 装飾画像（レイヤー3）</h2>
              <p className="text-sm text-gray-400 mb-4">
                推奨サイズ: 1200×1500px（透過PNG推奨）
              </p>

              {settings.overlayUrl && (
                <img
                  src={settings.overlayUrl}
                  alt="装飾"
                  className="w-full max-h-48 object-contain mb-4 rounded-lg bg-gray-800"
                />
              )}

              <input
                ref={overlayInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload("overlay", file);
                }}
              />
              <button
                onClick={() => overlayInputRef.current?.click()}
                disabled={isSaving}
                className="w-full btn-primary"
              >
                {settings.overlayUrl ? "装飾を変更" : "装飾をアップロード"}
              </button>
            </div>
          </div>

          {/* 配置設定 */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">📐 ユーザー画像の配置設定</h2>
            <p className="text-sm text-gray-400 mb-6">
              ユーザーがアップロードした画像を配置する位置とサイズを設定します。
              <br />
              出力画像サイズ: 1200×1500px
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">X位置 (px)</label>
                <input
                  type="number"
                  value={settings.userImageArea.x}
                  onChange={(e) => updatePosition("x", parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Y位置 (px)</label>
                <input
                  type="number"
                  value={settings.userImageArea.y}
                  onChange={(e) => updatePosition("y", parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">幅 (px)</label>
                <input
                  type="number"
                  value={settings.userImageArea.width}
                  onChange={(e) => updatePosition("width", parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">高さ (px)</label>
                <input
                  type="number"
                  value={settings.userImageArea.height}
                  onChange={(e) => updatePosition("height", parseInt(e.target.value) || 0)}
                  className="input-field"
                />
              </div>
            </div>

            {/* プレビュー */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">配置プレビュー</h3>
              <div
                className="relative bg-gray-800 rounded-lg overflow-hidden"
                style={{ aspectRatio: "1200/1500" }}
              >
                {settings.backgroundUrl && (
                  <img
                    src={settings.backgroundUrl}
                    alt="背景"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div
                  className="absolute border-2 border-dashed border-[var(--primary)] bg-[var(--primary)]/20 flex items-center justify-center text-xs"
                  style={{
                    left: `${(settings.userImageArea.x / 1200) * 100}%`,
                    top: `${(settings.userImageArea.y / 1500) * 100}%`,
                    width: `${(settings.userImageArea.width / 1200) * 100}%`,
                    height: `${(settings.userImageArea.height / 1500) * 100}%`,
                  }}
                >
                  ユーザー画像エリア
                </div>
                {settings.overlayUrl && (
                  <img
                    src={settings.overlayUrl}
                    alt="装飾"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                )}
              </div>
            </div>

            <button
              onClick={handleSavePosition}
              disabled={isSaving}
              className="w-full btn-primary"
            >
              {isSaving ? "保存中..." : "配置設定を保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


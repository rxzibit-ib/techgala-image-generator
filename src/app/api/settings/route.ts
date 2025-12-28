import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET() {
  try {
    // Vercel Blobから設定を取得
    const { blobs } = await list({ prefix: "settings/" });
    
    let backgroundUrl = null;
    let overlayUrl = null;
    let userImageArea = { x: 100, y: 150, width: 1000, height: 1000 };

    for (const blob of blobs) {
      if (blob.pathname.includes("background")) {
        backgroundUrl = blob.url;
      } else if (blob.pathname.includes("overlay")) {
        overlayUrl = blob.url;
      } else if (blob.pathname.includes("config.json")) {
        const res = await fetch(blob.url);
        const config = await res.json();
        userImageArea = config.userImageArea || userImageArea;
      }
    }

    return NextResponse.json({
      backgroundUrl,
      overlayUrl,
      userImageArea,
      outputWidth: 1200,
      outputHeight: 1500,
    });
  } catch {
    // Blob Storageが未設定の場合はデフォルト値を返す
    return NextResponse.json({
      backgroundUrl: null,
      overlayUrl: null,
      userImageArea: { x: 100, y: 150, width: 1000, height: 1000 },
      outputWidth: 1200,
      outputHeight: 1500,
    });
  }
}


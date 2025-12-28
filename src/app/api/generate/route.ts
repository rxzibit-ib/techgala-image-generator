import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { list } from "@vercel/blob";

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 1500;
const USER_IMAGE_SIZE = 1000;

export async function POST(request: NextRequest) {
  try {
    const { userImage } = await request.json();

    if (!userImage) {
      return NextResponse.json({ error: "画像が必要です" }, { status: 400 });
    }

    // Base64データからバッファを抽出
    const base64Data = userImage.replace(/^data:image\/\w+;base64,/, "");
    const userImageBuffer = Buffer.from(base64Data, "base64");

    // 設定とテンプレート画像を取得
    let backgroundBuffer: Buffer | null = null;
    let overlayBuffer: Buffer | null = null;
    let userImageArea = { x: 100, y: 150, width: USER_IMAGE_SIZE, height: USER_IMAGE_SIZE };

    try {
      const { blobs } = await list({ prefix: "settings/" });

      for (const blob of blobs) {
        if (blob.pathname.includes("background")) {
          const res = await fetch(blob.url);
          backgroundBuffer = Buffer.from(await res.arrayBuffer());
        } else if (blob.pathname.includes("overlay")) {
          const res = await fetch(blob.url);
          overlayBuffer = Buffer.from(await res.arrayBuffer());
        } else if (blob.pathname.includes("config.json")) {
          const res = await fetch(blob.url);
          const config = await res.json();
          userImageArea = config.userImageArea || userImageArea;
        }
      }
    } catch {
      // Blob未設定の場合は継続
    }

    // ユーザー画像を1000x1000にクロップ＆リサイズ
    const processedUserImage = await sharp(userImageBuffer)
      .resize(userImageArea.width, userImageArea.height, {
        fit: "cover",
        position: "centre",
      })
      .toBuffer();

    // 合成画像を作成
    let compositeImage = sharp({
      create: {
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        channels: 4,
        background: { r: 30, g: 30, b: 30, alpha: 1 },
      },
    });

    const composites: sharp.OverlayOptions[] = [];

    // 1. 背景画像
    if (backgroundBuffer) {
      const resizedBackground = await sharp(backgroundBuffer)
        .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover" })
        .toBuffer();
      composites.push({ input: resizedBackground, top: 0, left: 0 });
    }

    // 2. ユーザー画像
    composites.push({
      input: processedUserImage,
      top: userImageArea.y,
      left: userImageArea.x,
    });

    // 3. オーバーレイ（装飾）
    if (overlayBuffer) {
      const resizedOverlay = await sharp(overlayBuffer)
        .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, { fit: "cover" })
        .toBuffer();
      composites.push({ input: resizedOverlay, top: 0, left: 0 });
    }

    // 合成実行
    const resultBuffer = await compositeImage
      .composite(composites)
      .jpeg({ quality: 90 })
      .toBuffer();

    // レスポンス返却（ユーザー画像データは保持しない）
    return new NextResponse(new Uint8Array(resultBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": 'attachment; filename="techgala_image.jpg"',
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "画像生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}


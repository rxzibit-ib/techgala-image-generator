import { NextRequest, NextResponse } from "next/server";
import heicConvert from "heic-convert";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let jpegBuffer: Buffer;

    // HEICファイルを変換
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
      try {
        // HEICをJPEGに変換
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: "JPEG",
          quality: 0.9,
        });
        jpegBuffer = Buffer.from(outputBuffer);
      } catch {
        // heic-convertが失敗した場合、sharpを試す
        jpegBuffer = await sharp(inputBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();
      }
    } else {
      // 通常の画像をJPEGに変換
      jpegBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    // Base64に変換
    const base64 = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;

    return NextResponse.json({ base64 });
  } catch (error) {
    console.error("HEIC conversion error:", error);
    return NextResponse.json(
      { error: "画像の変換に失敗しました" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { put, del, list } from "@vercel/blob";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  // 認証チェック
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const { userImageArea } = await request.json();

    // 既存の設定ファイルを削除
    const { blobs } = await list({ prefix: "settings/config" });
    for (const blob of blobs) {
      await del(blob.url);
    }

    // 新しい設定ファイルをアップロード
    const configData = JSON.stringify({ userImageArea });
    const blob = await put(`settings/config.json`, configData, {
      access: "public",
      contentType: "application/json",
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Config save error:", error);
    return NextResponse.json({ error: "設定の保存に失敗しました" }, { status: 500 });
  }
}


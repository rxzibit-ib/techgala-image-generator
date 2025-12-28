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
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "ファイルとタイプが必要です" }, { status: 400 });
    }

    // 既存の同タイプファイルを削除
    const { blobs } = await list({ prefix: `settings/${type}` });
    for (const blob of blobs) {
      await del(blob.url);
    }

    // 新しいファイルをアップロード
    const blob = await put(`settings/${type}_${Date.now()}`, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}


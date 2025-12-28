# TechGALA Image Generator

TechGALAイベント用の画像ジェネレーターです。ユーザーがアップロードした画像を、管理者が設定したテンプレートと合成してオリジナル画像を作成できます。

## 機能

### ユーザー向け
- 📷 画像のアップロード（ドラッグ&ドロップ対応）
- 🖼️ 1000×1000pxへの自動クロップ・リサイズ
- ✨ テンプレートと合成した画像の生成（1200×1500px JPG）
- 💾 生成画像のダウンロード
- 📱 SNS共有ボタン（X/Twitter、Facebook）

### 管理者向け（認証必要）
- 🎨 背景画像（レイヤー1）のアップロード
- ✨ 装飾画像（レイヤー3）のアップロード
- 📐 ユーザー画像の配置位置・サイズ設定
- 👁️ 配置プレビュー

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **画像処理**: Sharp（無料・高速）
- **認証**: NextAuth.js
- **画像ストレージ**: Vercel Blob
- **スタイリング**: Tailwind CSS
- **ホスティング**: Vercel

## セットアップ

### ローカル開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

### 環境変数

`.env.local`ファイルに以下を設定：

```
# NextAuth設定（本番環境では安全なキーを生成）
AUTH_SECRET=your-secret-key-here

# 管理者認証情報
ADMIN_ID=admin
ADMIN_PASSWORD=techgala2025

# Vercel Blob（Vercelにデプロイ後、自動設定）
BLOB_READ_WRITE_TOKEN=
```

## Vercelへのデプロイ

### 1. GitHubにプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercelプロジェクト作成

1. [Vercel](https://vercel.com)にアクセス
2. "Add New Project" → GitHubリポジトリを選択
3. "Deploy"をクリック

### 3. Vercel Blobの設定

1. Vercelダッシュボードでプロジェクトを選択
2. "Storage"タブをクリック
3. "Create Database" → "Blob"を選択
4. 名前を入力して作成
5. 自動的に`BLOB_READ_WRITE_TOKEN`が設定されます

### 4. 環境変数の設定

1. "Settings" → "Environment Variables"
2. 以下を追加：
   - `AUTH_SECRET`: `openssl rand -base64 32`で生成した値
   - `ADMIN_ID`: 管理者ID
   - `ADMIN_PASSWORD`: 管理者パスワード

### 5. 再デプロイ

環境変数を追加後、"Deployments"から最新のデプロイを"Redeploy"

## 使い方

### 管理者

1. `/admin/login`にアクセス
2. ID・パスワードでログイン
3. 背景画像（1200×1500px推奨）をアップロード
4. 装飾画像（透過PNG、1200×1500px推奨）をアップロード
5. ユーザー画像の配置位置を設定
6. 設定を保存

### ユーザー

1. トップページにアクセス
2. 画像をアップロード
3. 「画像を生成」をクリック
4. ダウンロードまたはSNS共有

## レイヤー構成

```
┌─────────────────────┐
│   レイヤー3（装飾）    │  ← 管理者設定
├─────────────────────┤
│  レイヤー2（ユーザー）  │  ← ユーザーアップロード
├─────────────────────┤
│   レイヤー1（背景）    │  ← 管理者設定
└─────────────────────┘
```

## プライバシー

- ユーザーがアップロードした画像はサーバーに保存されません
- 画像生成後、即座に破棄されます

## ライセンス

MIT

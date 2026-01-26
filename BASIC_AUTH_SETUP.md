# Basic Authentication Setup Guide

このプロジェクトは、外部からのアクセスを制限するために Basic 認証が実装されています。

## ローカル開発環境のセットアップ

1. `.env.local` ファイルをプロジェトのルートディレクトリに作成してください：

```env
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=your-secure-password-here
```

2. `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` を任意の値に変更してください。

3. 開発サーバーを起動：

```bash
npm run dev
```

4. ブラウザで `http://localhost:3000` にアクセスすると、ユーザー名とパスワードの入力が求められます。

## Vercel へのデプロイ設定

### 方法1: Vercel Dashboard で設定

1. Vercel のプロジェクトダッシュボードにログインします
2. プロジェクトを選択します
3. **Settings** タブをクリックします
4. 左サイドバーから **Environment Variables** を選択します
5. 以下の環境変数を追加します：
   - **Name**: `BASIC_AUTH_USER`
     - **Value**: 任意のユーザー名（例: `admin`）
     - **Environment**: Production, Preview, Development すべてにチェック
   - **Name**: `BASIC_AUTH_PASSWORD`
     - **Value**: 任意のセキュアなパスワード
     - **Environment**: Production, Preview, Development すべてにチェック
6. **Save** をクリックします
7. プロジェクトを再デプロイします（自動的に再デプロイされる場合もあります）

### 方法2: Vercel CLI で設定

```bash
# Production 環境用
vercel env add BASIC_AUTH_USER
vercel env add BASIC_AUTH_PASSWORD

# 値を入力するプロンプトが表示されます
```

### 方法3: vercel.json で設定（推奨しません - セキュリティリスク）

環境変数は vercel.json に直接記述しないでください。必ず Vercel の環境変数設定を使用してください。

## セキュリティに関する注意事項

⚠️ **重要**: 
- `.env.local` ファイルは Git にコミットしないでください（すでに `.gitignore` に含まれています）
- 本番環境では強力なパスワードを使用してください
- パスワードは定期的に変更してください
- ユーザー名とパスワードを安全に管理してください

## 動作確認

デプロイ後、サイトにアクセスすると自動的に認証ダイアログが表示されます：
- ユーザー名: 設定した `BASIC_AUTH_USER` の値
- パスワード: 設定した `BASIC_AUTH_PASSWORD` の値

正しい認証情報を入力すると、サイトにアクセスできます。

## トラブルシューティング

### 認証が機能しない場合

1. Vercel の環境変数が正しく設定されているか確認してください
2. 環境変数を追加・変更した後、プロジェクトを再デプロイしてください
3. Vercel のログを確認してください（Dashboard → Deployments → 該当デプロイ → Logs）

### 認証をバイパスしたい場合

開発中に認証を無効にしたい場合は、環境変数を設定しないでください。
`BASIC_AUTH_USER` または `BASIC_AUTH_PASSWORD` が設定されていない場合、認証はスキップされます。

---

## Basic Authentication Setup Guide (English)

This project implements Basic Authentication to restrict external access.

## Local Development Setup

1. Create a `.env.local` file in the project root:

```env
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=your-secure-password-here
```

2. Change `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` to your desired credentials.

3. Start the development server:

```bash
npm run dev
```

4. When you access `http://localhost:3000`, you'll be prompted for username and password.

## Vercel Deployment Configuration

### Method 1: Set via Vercel Dashboard

1. Log in to your Vercel project dashboard
2. Select your project
3. Click the **Settings** tab
4. Select **Environment Variables** from the left sidebar
5. Add the following environment variables:
   - **Name**: `BASIC_AUTH_USER`
     - **Value**: Your desired username (e.g., `admin`)
     - **Environment**: Check Production, Preview, and Development
   - **Name**: `BASIC_AUTH_PASSWORD`
     - **Value**: Your secure password
     - **Environment**: Check Production, Preview, and Development
6. Click **Save**
7. Redeploy your project (it may redeploy automatically)

### Method 2: Set via Vercel CLI

```bash
# For production environment
vercel env add BASIC_AUTH_USER
vercel env add BASIC_AUTH_PASSWORD

# You'll be prompted to enter the values
```

## Security Notes

⚠️ **Important**: 
- Never commit `.env.local` to Git (already included in `.gitignore`)
- Use strong passwords in production
- Change passwords regularly
- Store credentials securely

## Verification

After deployment, accessing your site will automatically show an authentication dialog:
- Username: The value you set for `BASIC_AUTH_USER`
- Password: The value you set for `BASIC_AUTH_PASSWORD`

Enter the correct credentials to access the site.

## Troubleshooting

### If authentication doesn't work

1. Verify that Vercel environment variables are set correctly
2. Redeploy the project after adding/changing environment variables
3. Check Vercel logs (Dashboard → Deployments → Select deployment → Logs)

### To bypass authentication

If you want to disable authentication during development, simply don't set the environment variables.
If `BASIC_AUTH_USER` or `BASIC_AUTH_PASSWORD` is not set, authentication will be skipped.


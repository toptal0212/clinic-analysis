# 🔐 Vercel Basic認証 設定チェックリスト

## クライアント様へ

外部アクセス制限のため、Basic認証を実装いたしました。  
以下の手順に従って、Vercelで設定を完了してください。

---

## ⚡ クイックセットアップ（5分）

### 📍 ステップ1: Vercelダッシュボードを開く

1. https://vercel.com/ にアクセスしてログイン
2. 該当プロジェクトをクリック

### 📍 ステップ2: 環境変数を設定

1. **Settings** タブをクリック
2. 左メニューから **Environment Variables** を選択
3. 以下を入力：

```
Name:  BASIC_AUTH_USER
Value: admin（お好きなユーザー名に変更可能）
Environment: ✓ Production ✓ Preview ✓ Development
→ [Save] をクリック

Name:  BASIC_AUTH_PASSWORD
Value: お好きなセキュアなパスワード
Environment: ✓ Production ✓ Preview ✓ Development
→ [Save] をクリック
```

### 📍 ステップ3: 再デプロイ

1. **Deployments** タブをクリック
2. 最新のデプロイメントの右側 **「⋯」** をクリック
3. **Redeploy** を選択して実行

### 📍 ステップ4: 動作確認

1. サイトのURLにアクセス
2. 認証ダイアログが表示される ✅
3. 設定したユーザー名とパスワードを入力
4. ログイン成功 ✅

---

## ✅ 完了チェックリスト

- [ ] Vercelにログインした
- [ ] プロジェクトの Settings → Environment Variables を開いた
- [ ] `BASIC_AUTH_USER` を追加して保存した
- [ ] `BASIC_AUTH_PASSWORD` を追加して保存した
- [ ] 両方の変数で3つの環境（Production/Preview/Development）にチェックした
- [ ] Deployments から Redeploy を実行した
- [ ] 再デプロイが完了した（緑のチェックマーク）
- [ ] サイトにアクセスして認証ダイアログが表示されることを確認した
- [ ] 正しいユーザー名とパスワードでログインできた
- [ ] 認証情報を安全な場所に保管した

---

## 🎯 推奨設定例

```
ユーザー名: admin
パスワード: 強力なパスワード（12文字以上、英数字＋記号）

例:
✅ MyClinic@2026!Secure
✅ Clinic#Sales$2026
❌ password（弱すぎる）
❌ 123456（弱すぎる）
```

---

## 📸 設定画面イメージ

### Environment Variables画面

```
┌──────────────────────────────────────────────┐
│ Settings > Environment Variables              │
├──────────────────────────────────────────────┤
│                                               │
│ Add New Variable                              │
│                                               │
│ Name                                          │
│ ┌─────────────────────────────────────────┐  │
│ │ BASIC_AUTH_USER                         │  │
│ └─────────────────────────────────────────┘  │
│                                               │
│ Value                                         │
│ ┌─────────────────────────────────────────┐  │
│ │ admin                                   │  │
│ └─────────────────────────────────────────┘  │
│                                               │
│ Environments                                  │
│ ☑ Production  ☑ Preview  ☑ Development      │
│                                               │
│              [Cancel]  [Save] ←クリック        │
└──────────────────────────────────────────────┘
```

---

## 🆘 困ったときは

### 認証ダイアログが表示されない

**対処法:**
1. Vercelの環境変数が正しく保存されているか確認
2. 再デプロイが完了しているか確認（緑のチェックマーク）
3. ブラウザをリフレッシュ（Ctrl + Shift + R）
4. プライベートモード/シークレットモードで再度アクセス

### 正しいパスワードなのにログインできない

**対処法:**
1. 大文字・小文字を確認
2. パスワードの前後にスペースが入っていないか確認
3. Vercelで環境変数を再入力して保存
4. 再デプロイを実行

### パスワードを忘れた

**対処法:**
1. Vercelの Environment Variables で `BASIC_AUTH_PASSWORD` を編集
2. 新しいパスワードを設定
3. 保存して再デプロイ

---

## 📞 サポート

設定でお困りの際は、以下をご連絡ください：

- スクリーンショット（パスワードは隠してください）
- エラーメッセージ
- 実施した手順

---

## 📝 認証情報の管理

### ✅ すること
- 認証情報をパスワードマネージャーで管理
- 必要な関係者のみに共有
- 定期的にパスワードを変更

### ❌ しないこと
- メールやチャットでパスワードを平文で送信
- 簡単なパスワードを使用
- 公開の場所にメモを残す

---

## 🎉 完了後の状態

設定が完了すると：

✅ サイトにアクセスするとブラウザの認証ダイアログが表示される  
✅ 正しいユーザー名とパスワードを入力しないとアクセスできない  
✅ 認証後は通常通りサイトを利用できる  
✅ ブラウザを閉じるまで認証情報は保持される  

---

**作成日**: 2026年1月23日  
**実装者**: 開発チーム  
**ドキュメントバージョン**: 1.0

---

## 🇬🇧 English Quick Guide

### Quick Setup (5 minutes)

1. **Go to Vercel Dashboard** → Select your project
2. **Settings** → **Environment Variables**
3. **Add these variables:**
   - `BASIC_AUTH_USER` = your-username
   - `BASIC_AUTH_PASSWORD` = your-secure-password
   - Select all environments (Production, Preview, Development)
4. **Deployments** → Click **"⋯"** → **Redeploy**
5. **Test**: Visit your site, enter credentials when prompted

**Done!** ✅

For detailed instructions, see `BASIC_AUTH_SETUP.md`


# Medical Force 売上分析ダッシュボード (Next.js版)

Medical Force APIと連携した美容クリニック向けの包括的な売上分析システムです。Next.js 14、TypeScript、Tailwind CSSを使用して構築されています。

## 🚀 主な機能

### データ連携
- 🔌 **Medical Force API連携** - 電子カルテシステムとのリアルタイムデータ取得
- 📊 **外部API連携** - Google Analytics、Google広告、Meta広告との統合
- 📁 **CSVインポート** - 来院者情報・会計情報のファイルアップロード対応

### 分析機能
- 📈 **サマリー分析** - 階層化された施術別売上分析（美容/その他 → 外科/皮膚科/脱毛等）
- 📅 **日別分析** - 日々の売上詳細と変動追跡、ドリルダウン機能
- 🏥 **全院比較** - 過去2年間のデータ比較とパフォーマンス分析
- 👥 **来院者情報管理** - 患者詳細情報の表示・編集・検索機能
- 🎯 **目標達成率管理** - スタッフ個人の目標設定と進捗可視化
- 🔄 **リピート率分析** - 6ヶ月・12ヶ月リピート率の自動計算と改善提案

### データ処理
- 📊 **複雑な売上計算** - 当日単価、新規単価、既存単価の自動計算
- 🏥 **階層的カテゴリー分類** - 美容/その他 → 外科/皮膚科/脱毛/その他の詳細分類
- ⚠️ **データ検証** - 入力データの整合性チェックとエラー表示
- 🔍 **エラー管理** - データ品質向上のための包括的なエラー検出・修正ガイド

### UI/UX
- 📈 **インタラクティブチャート** - Chart.jsを使用した美しいデータ可視化
- 📱 **レスポンシブデザイン** - デスクトップ、タブレット、モバイル対応
- 🎨 **モダンUI** - Tailwind CSSによる美しいデザイン
- 🗂️ **タブ式ナビゲーション** - 直感的な機能切り替え

## 🛠️ 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **State Management**: React Context + useReducer
- **Data Processing**: Papa Parse (CSV)

## 📦 インストール

### 前提条件

- Node.js 18.0以上
- npm または yarn
- Medical Force API Key（API連携を使用する場合）

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd medical-force-dashboard
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   # または
   yarn install
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   # または
   yarn dev
   ```

4. **ブラウザでアクセス**
   `http://localhost:3000` にアクセスしてアプリケーションを表示

## 📁 プロジェクト構造

```
medical-force-dashboard/
├── app/                    # Next.js App Router
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── Dashboard.tsx      # メインダッシュボード
│   ├── Header.tsx         # ヘッダーコンポーネント
│   ├── Sidebar.tsx        # サイドバーナビゲーション
│   ├── KPICards.tsx       # KPIカード
│   ├── RevenueChart.tsx   # 売上チャート
│   ├── DemographicsCharts.tsx # デモグラフィックチャート
│   └── DataTable.tsx      # データテーブル
├── contexts/              # React Context
│   └── DashboardContext.tsx # ダッシュボード状態管理
├── lib/                   # ユーティリティとAPI
│   ├── api.ts            # Medical Force API連携
│   └── utils.ts          # ヘルパー関数
├── public/               # 静的ファイル
├── package.json          # 依存関係とスクリプト
├── tailwind.config.js    # Tailwind CSS設定
├── tsconfig.json         # TypeScript設定
└── next.config.js        # Next.js設定
```

## 🎯 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルドを作成
- `npm run start` - プロダクションサーバーを起動
- `npm run lint` - ESLintでコードをチェック

## 🔧 設定

### 環境変数

`.env.local`ファイルを作成して以下の環境変数を設定：

```env
# Medical Force API (OAuth2認証)
NEXT_PUBLIC_MF_CLIENT_ID=74kgoefn8h2pbslk8qo50j99to
NEXT_PUBLIC_MF_CLIENT_SECRET=1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0

# 外部API連携（オプション）
NEXT_PUBLIC_GA_PROPERTY_ID=your_ga_property_id
NEXT_PUBLIC_GA_ACCESS_TOKEN=your_ga_access_token
NEXT_PUBLIC_GOOGLE_ADS_CUSTOMER_ID=your_google_ads_customer_id
NEXT_PUBLIC_GOOGLE_ADS_DEVELOPER_TOKEN=your_google_ads_developer_token
NEXT_PUBLIC_META_ADS_ACCOUNT_ID=your_meta_ads_account_id
NEXT_PUBLIC_META_ACCESS_TOKEN=your_meta_access_token
```

### Medical Force API連携

1. **OAuth2認証の設定**
   - ダッシュボードの「API接続」ボタンをクリック
   - Client IDとClient Secretが自動設定済み（デフォルト値使用）
   - データ取得期間を設定
   - 「クイック接続」ボタンで簡単に接続可能

2. **CSVインポート**
   - API接続の代わりにCSVファイルを使用可能
   - 来院者情報CSVと会計情報CSVをアップロード

3. **外部API連携**
   - ヘッダーの「外部API連携」ボタンから設定
   - Google Analytics、Google広告、Meta広告のデータを統合

## 📊 データ構造

### 患者データ (来院者情報)
```typescript
interface Patient {
  id: string
  name: string
  age: number
  treatmentCategory: string
  treatmentName: string
  visitDate: Date
  referralSource: string
  appointmentRoute: string
  staff: string
}
```

### 会計データ
```typescript
interface Accounting {
  id: string
  patientId: string
  amount: number
  paymentDate: Date
  visitDate: Date
  treatmentType: string
  isAdvancePayment: boolean
}
```

## 🎨 カスタマイズ

### カテゴリー分類の変更

`lib/api.ts`の`categorizeTreatment`メソッドを編集してカテゴリー分類をカスタマイズできます。

### チャートのカスタマイズ

`components/RevenueChart.tsx`と`components/DemographicsCharts.tsx`でチャートの設定を変更できます。

### スタイリング

`tailwind.config.js`でカラーパレットやテーマをカスタマイズできます。

## 🚀 デプロイ

### Vercel（推奨）

1. Vercelアカウントにログイン
2. リポジトリをインポート
3. 環境変数を設定
4. デプロイ

### その他のプラットフォーム

```bash
npm run build
npm run start
```

## 🤝 コントリビューション

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。

---

**Medical Force 売上分析ダッシュボード** - 美容クリニックの売上分析を効率化
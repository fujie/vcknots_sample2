# VCKnots Sample - Demo UI & E2E Test

[vcknots](https://github.com/trustknots/vcknots) を使用した Verifiable Credentials (OID4VCI / OID4VP) のデモ環境です。

## 構成

```
demo/
  index.html        - ランディングページ
  issuer.html       - Issuer UI (クレデンシャルオファー生成)
  wallet.html       - Wallet UI (クレデンシャル受取・提示)
  verifier.html     - Verifier UI (検証リクエスト作成)
  server.mjs        - デモ用プロキシサーバー (Node.js)
  tsconfig.json     - TypeScript設定
test-e2e.ts          - E2Eテストスクリプト
```

## 前提条件

- Node.js 22+
- pnpm 10.11.0
- vcknots リポジトリのクローンとビルド済み環境

## セットアップ

1. vcknots をクローンしてビルド:
```bash
git clone https://github.com/trustknots/vcknots.git
cd vcknots
corepack enable
pnpm install
pnpm -F @trustknots/vcknots build
pnpm -F @trustknots/server-core build
pnpm -F @trustknots/server build
```

2. サーバー設定:
```bash
cp server/single/.env.example server/single/.env
# BASE_URL=http://localhost:8080 に変更
```

3. このリポジトリのファイルを vcknots ディレクトリにコピー:
```bash
# demo/ フォルダと test-e2e.ts をコピー
```

## 使い方

### バックエンドサーバー起動
```bash
pnpm -F @trustknots/server start
```

### デモUIサーバー起動
```bash
node demo/server.mjs
```
ブラウザで http://localhost:3000 にアクセス

### E2Eテスト実行
```bash
npx tsx test-e2e.ts
```

## デモフロー

1. **Issuer** でクレデンシャルオファーを生成
2. 生成されたURLをコピーして **Wallet** に貼り付け → クレデンシャル受取
3. **Verifier** で検証リクエストを作成
4. 生成されたURLをコピーして **Wallet** に貼り付け → クレデンシャル提示
5. **Verifier** で検証結果を確認

## ライセンス

MIT

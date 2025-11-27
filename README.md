# Password Manager

セキュアなローカルパスワードマネージャー - Tauri + React製

## 特徴

- 🔒 AES-256-GCM暗号化
- 🔑 Argon2によるパスワード派生
- 💾 ローカルストレージ（クラウド同期なし）
- 🖥️ クロスプラットフォーム（macOS、Windows、Linux）
- 🎨 モダンなUI（React + Tailwind CSS）

## 開発

### 前提条件

- Node.js 18以上
- pnpm
- Rust（最新安定版）

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm tauri:dev
```

### アイコンの更新

`app-icon.png`を編集した後、以下のコマンドで全プラットフォーム用のアイコンを生成：

```bash
# すべてのアイコンを生成
pnpm icons:all

# または個別に
pnpm icons          # PNG icons
pnpm icons:macos    # .icns (macOS)
pnpm icons:windows  # .ico (Windows)
```

## ビルド

### クイックビルド（現在のプラットフォーム）

```bash
pnpm package
```

### プラットフォーム別ビルド

```bash
# macOS (Universal Binary)
pnpm package:macos

# Windows
pnpm package:windows

# Linux
pnpm package:linux
```

詳細は[BUILD.md](BUILD.md)を参照してください。

## 技術スタック

### フロントエンド
- React 19
- Vite
- Tailwind CSS

### バックエンド
- Tauri 2
- Rust
- AES-GCM暗号化
- Argon2パスワードハッシュ

## セキュリティ

このアプリケーションは以下のセキュリティ機能を実装しています：

- **AES-256-GCM暗号化** - 業界標準の暗号化アルゴリズム
- **Argon2パスワードハッシュ** - メモリハード関数による鍵導出
- **ローカルストレージのみ** - データはクラウドに送信されません
- **自動ロック機能** - 一定時間後に自動的にロック
- **メモリ内の機密データ保護** - `secrecy`クレートによる保護

## ライセンス

[MIT](LICENSE)

Copyright (c) 2025 maromiya

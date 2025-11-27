# ビルドガイド

## 前提条件

### すべてのプラットフォーム
- Node.js (v18以上)
- pnpm
- Rust (最新安定版)

### macOS
```bash
# Xcode Command Line Tools
xcode-select --install
```

### Windows
```bash
# Microsoft Visual Studio C++ Build Tools
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
# WebView2 (通常はWindows 11に含まれています)
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## ビルドコマンド

### 開発モード
```bash
pnpm tauri:dev
```

### プロダクションビルド（現在のプラットフォーム）
```bash
pnpm package
```

### デバッグビルド（高速、最適化なし）
```bash
pnpm package:debug
```

### プラットフォーム別ビルド

#### macOS (Universal Binary - Intel + Apple Silicon)
```bash
pnpm package:macos
```
出力: `src-tauri/target/universal-apple-darwin/release/bundle/`
- `.app` - アプリケーションバンドル
- `.dmg` - インストーラー

#### Windows
```bash
pnpm package:windows
```
出力: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/`
- `.exe` - インストーラー
- `.msi` - MSIインストーラー

#### Linux
```bash
pnpm package:linux
```
出力: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/`
- `.deb` - Debianパッケージ
- `.AppImage` - AppImageバンドル

## クロスプラットフォームビルドの制限

Tauriは基本的に**ネイティブビルド**が必要です：
- macOSアプリはmacOS上でビルド
- WindowsアプリはWindows上でビルド
- LinuxアプリはLinux上でビルド

### CI/CDでのクロスプラットフォームビルド

GitHub Actionsなどを使用して、各プラットフォームでビルドを実行できます。

`.github/workflows/build.yml`の例：
```yaml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt update
          sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm package
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}-build
          path: src-tauri/target/release/bundle/
```

## トラブルシューティング

### macOS: "cannot be opened because the developer cannot be verified"
```bash
# アプリに署名していない場合
xattr -cr /path/to/password-manager.app
```

### Linux: AppImageが実行できない
```bash
chmod +x password-manager.AppImage
```

### Windows: SmartScreenの警告
アプリに署名していない場合、Windows SmartScreenが警告を表示します。
「詳細情報」→「実行」で起動できます。

## コード署名

### macOS
```bash
# Apple Developer証明書が必要
export APPLE_CERTIFICATE="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_CERTIFICATE_PASSWORD="password"
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"

pnpm package:macos
```

### Windows
```bash
# コード署名証明書が必要
# tauri.conf.jsonでcertificateThumbprintを設定
```

## ビルドサイズの最適化

プロダクションビルドでは自動的に最適化されますが、さらに小さくするには：

```toml
# src-tauri/Cargo.toml
[profile.release]
strip = true
opt-level = "z"
lto = true
codegen-units = 1
```

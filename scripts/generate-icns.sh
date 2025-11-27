#!/bin/bash

# macOS用 .icns ファイルを生成するスクリプト

ICONS_DIR="src-tauri/icons"
ICONSET_DIR="$ICONS_DIR/icon.iconset"

echo "🍎 macOS用 .icns ファイルを生成中..."

# iconsetディレクトリを作成
mkdir -p "$ICONSET_DIR"

# 各サイズのアイコンをコピー
cp "$ICONS_DIR/32x32.png" "$ICONSET_DIR/icon_16x16@2x.png"
cp "$ICONS_DIR/32x32.png" "$ICONSET_DIR/icon_32x32.png"
cp "$ICONS_DIR/64x64.png" "$ICONSET_DIR/icon_32x32@2x.png"
cp "$ICONS_DIR/128x128.png" "$ICONSET_DIR/icon_128x128.png"
cp "$ICONS_DIR/256x256.png" "$ICONSET_DIR/icon_128x128@2x.png"
cp "$ICONS_DIR/256x256.png" "$ICONSET_DIR/icon_256x256.png"
cp "$ICONS_DIR/512x512.png" "$ICONSET_DIR/icon_256x256@2x.png"
cp "$ICONS_DIR/512x512.png" "$ICONSET_DIR/icon_512x512.png"
cp "$ICONS_DIR/icon.png" "$ICONSET_DIR/icon_512x512@2x.png"

# 16x16を生成（存在しない場合）
if [ ! -f "$ICONS_DIR/16x16.png" ]; then
  sips -z 16 16 "$ICONS_DIR/32x32.png" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
else
  cp "$ICONS_DIR/16x16.png" "$ICONSET_DIR/icon_16x16.png"
fi

# iconutilで .icns を生成
iconutil -c icns "$ICONSET_DIR" -o "$ICONS_DIR/icon.icns"

# 一時ディレクトリを削除
rm -rf "$ICONSET_DIR"

echo "✅ icon.icns を生成しました: $ICONS_DIR/icon.icns"

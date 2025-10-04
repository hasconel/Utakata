# 🐳 NetRadio Signaling Server - Docker設定

WebRTC signaling serverのDocker設定ファイルです。

## 📁 ファイル構成

- `Dockerfile` - 本番用Dockerイメージの定義
- `docker-compose.yml` - 本番用Docker Compose設定
- `docker-compose.dev.yml` - 開発用Docker Compose設定
- `.dockerignore` - Dockerイメージに含めないファイルの指定

## 🚀 使い方

### 本番環境での実行

```bash
# Dockerイメージをビルド
docker build -t netradio-server:latest .

# Docker Composeで実行
docker-compose up -d

# ログを確認
docker-compose logs -f

# 停止
docker-compose down
```

### 開発環境での実行

```bash
# 開発用Docker Composeで実行（ホットリロード対応）
docker-compose -f docker-compose.dev.yml up

# バックグラウンドで実行
docker-compose -f docker-compose.dev.yml up -d

# 停止
docker-compose -f docker-compose.dev.yml down
```

### 個別のDockerコマンド

```bash
# イメージをビルド
docker build -t netradio-server .

# コンテナを実行
docker run -p 6150:6150 netradio-server

# バックグラウンドで実行
docker run -d -p 6150:6150 --name netradio-server netradio-server

# コンテナを停止・削除
docker stop netradio-server
docker rm netradio-server
```

## 🔧 設定項目

### ポート設定
- **本番環境**: 6150番ポート
- **開発環境**: 6150番ポート + 9229番ポート（デバッグ用）

### 環境変数
- `NODE_ENV`: 実行環境（production/development）
- `PORT`: サーバーポート（デフォルト: 6150）
- `DEBUG`: デバッグレベル（開発環境のみ）

### リソース制限
- **本番環境**: メモリ512MB、CPU 0.5コア
- **開発環境**: メモリ1GB、CPU 1.0コア

## 🛡️ セキュリティ機能

- 非rootユーザーでの実行
- 最小権限の原則
- ヘルスチェック機能
- ログローテーション

## 📊 監視・ログ

### ヘルスチェック
```bash
# コンテナの状態確認
docker-compose ps

# ヘルスチェック結果確認
docker inspect netradio-signaling-server | grep -A 10 Health
```

### ログ確認
```bash
# リアルタイムログ
docker-compose logs -f netradio-server

# 特定の行数だけ表示
docker-compose logs --tail=100 netradio-server
```

## 🔄 更新・デプロイ

```bash
# イメージを再ビルド
docker-compose build --no-cache

# サービスを再起動
docker-compose up -d --force-recreate

# 古いイメージを削除
docker image prune -f
```

## 🐛 トラブルシューティング

### ポートが使用中の場合
```bash
# ポート6150を使用しているプロセスを確認
lsof -i :6150

# プロセスを終了
kill -9 <PID>
```

### コンテナが起動しない場合
```bash
# コンテナのログを確認
docker-compose logs netradio-server

# コンテナに直接入ってデバッグ
docker-compose exec netradio-server sh
```

## 📝 注意事項

- 本番環境では必ず環境変数を適切に設定してください
- ログファイルは定期的にローテーションされます
- セキュリティのため、不要なポートは公開しないでください
- リソース制限は環境に応じて調整してください

---

**平成20年代の技術もあーしがちゃんとサポートしてあげるからね〜！** ✨

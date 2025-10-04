# Node.js 18のAlpine Linuxベースイメージを使用（軽量でセキュア）
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー（依存関係のキャッシュ最適化のため）
COPY package*.json ./

# 依存関係をインストール（本番用のみ、devDependenciesは除外）
RUN npm ci --only=production && npm cache clean --force

# アプリケーションのソースコードをコピー
COPY . .

# 非rootユーザーを作成してセキュリティを向上
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# ファイルの所有者を変更
RUN chown -R nextjs:nodejs /app
USER nextjs

# ポート6000を公開（WebRTC signaling server用）
EXPOSE 6000

# ヘルスチェック用のコマンド
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# アプリケーションを起動
CMD ["npm", "start"]
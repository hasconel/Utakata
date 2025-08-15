#!/usr/bin/env node

// 環境変数確認スクリプト
console.log('🔍 環境変数の確認');
console.log('=' .repeat(50));

// 重要な環境変数（環境に関係なく必要）
const importantVars = [
  // 基本設定
  'NODE_ENV',
  'NEXT_PUBLIC_APP_ENV',
  'NEXT_TELEMETRY_DISABLED',
  
  // 公開設定
  'NEXT_PUBLIC_DOMAIN',
  'NEXT_PUBLIC_MEILISEARCH_API_KEY',
  'NEXT_PUBLIC_MEILISEARCH_HOST',
  
  // Appwrite設定
  'APPWRITE_ENDPOINT',
  'APPWRITE_PROJECT_ID',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_POSTS_COLLECTION_ID',
  'APPWRITE_POSTS_SUB_COLLECTION_ID',
  'APPWRITE_ACTORS_COLLECTION_ID',
  'APPWRITE_ACTORS_SUB_COLLECTION_ID',
  'APPWRITE_LIKES_COLLECTION_ID',
  'APPWRITE_FOLLOWS_COLLECTION_ID',
  'APPWRITE_NOTIFICATIONS_COLLECTION_ID',
  'APPWRITE_STORAGE_ID',
  
  // セキュリティ設定
  'APPWRITE_API_KEY',
  'APPWRITE_ENCRYPTION_KEY',
  
  // Meilisearch設定
  'MEILISEARCH_API_KEY'
];

console.log('📋 現在の環境変数:');
importantVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value || '未設定'}`);
});

console.log('\n🎯 環境の判定:');
const nodeEnv = process.env.NODE_ENV || 'development';
const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';
const telemetryDisabled = process.env.NEXT_TELEMETRY_DISABLED || '0';

console.log(`NODE_ENV: ${nodeEnv}`);
console.log(`NEXT_PUBLIC_APP_ENV: ${appEnv}`);
console.log(`NEXT_TELEMETRY_DISABLED: ${telemetryDisabled}`);

if (nodeEnv === 'production') {
  console.log('🚀 本番環境として認識されています');
} else if (nodeEnv === 'development') {
  console.log('🛠️ 開発環境として認識されています');
} else {
  console.log('⚠️ 不明な環境です');
}

console.log('\n💡 重要なポイント:');
console.log('✅ 開発環境と本番環境で同じ設定を使用');
console.log('✅ 環境による動作の違いを排除');
console.log('✅ 一貫したユーザー体験を提供');
console.log('✅ セキュリティ設定の統一');

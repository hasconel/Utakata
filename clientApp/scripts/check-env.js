#!/usr/bin/env node

// 環境変数確認スクリプト
console.log('🔍 環境変数の確認');
console.log('=' .repeat(50));

// 重要な環境変数
const importantVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_ENV',
  'NEXT_TELEMETRY_DISABLED',
  'NEXT_PUBLIC_DOMAIN',
  'NEXT_PUBLIC_MEILISEARCH_HOST'
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

console.log(`NODE_ENV: ${nodeEnv}`);
console.log(`NEXT_PUBLIC_APP_ENV: ${appEnv}`);

if (nodeEnv === 'production') {
  console.log('🚀 本番環境として認識されています');
} else if (nodeEnv === 'development') {
  console.log('🛠️ 開発環境として認識されています');
} else {
  console.log('⚠️ 不明な環境です');
}

console.log('\n💡 推奨設定:');
console.log('開発環境: NODE_ENV=development');
console.log('本番環境: NODE_ENV=production');
console.log('テスト環境: NODE_ENV=test');

console.log('\n✨ 環境変数の確認が完了しました');

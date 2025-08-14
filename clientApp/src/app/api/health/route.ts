import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 基本的なヘルスチェック（最適化版）
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    };

    // 高速レスポンス
    return new NextResponse(JSON.stringify(healthData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        'X-Response-Time': 'fast'
      }
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

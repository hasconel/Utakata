"use client";

import { useEffect, useRef, useCallback } from 'react';

// パフォーマンスメトリクスの型定義
interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  apiResponseTime: number[];
  imageLoadTime: number[];
  errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    type: 'js' | 'api' | 'resource';
  }>;
}

// パフォーマンス監視フック
export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    apiResponseTime: [],
    imageLoadTime: [],
    errors: [],
  });

  const observerRef = useRef<PerformanceObserver | null>(null);

  // Core Web Vitalsの監視
  const observeCoreWebVitals = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      // LCP (Largest Contentful Paint)
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        if (lastEntry) {
          metricsRef.current.lcp = lastEntry.startTime;
          //console.log('LCP:', lastEntry.startTime, 'ms');
        }
      });
      observerRef.current.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const firstInputEntry = entry as PerformanceEventTiming;
          if (firstInputEntry.processingStart) {
            metricsRef.current.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
            //console.log('FID:', firstInputEntry.processingStart - firstInputEntry.startTime, 'ms');
          }
        });
      });
      observerRef.current.observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      observerRef.current = new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        metricsRef.current.cls = cls;
        //console.log('CLS:', cls);
      });
      observerRef.current.observe({ entryTypes: ['layout-shift'] });

      // FCP (First Contentful Paint)
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        if (firstEntry) {
          metricsRef.current.fcp = firstEntry.startTime;
          //console.log('FCP:', firstEntry.startTime, 'ms');
        }
      });
      observerRef.current.observe({ entryTypes: ['first-contentful-paint'] });

    } catch (error) {
      console.error('Core Web Vitals observation failed:', error);
    }
  }, []);

  // TTFB (Time to First Byte)の監視
  const observeTTFB = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    try {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.responseStart > 0) {
            const ttfb = entry.responseStart - entry.requestStart;
            metricsRef.current.ttfb = ttfb;
            //console.log('TTFB:', ttfb, 'ms');
          }
        });
      });
      observerRef.current.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.error('TTFB observation failed:', error);
    }
  }, []);

  // 画像読み込み時間の監視
  const observeImageLoad = useCallback(() => {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (img.complete) {
        // 既に読み込み済み
        return;
      }

      const startTime = performance.now();
      
      img.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        metricsRef.current.imageLoadTime.push(loadTime);
        //console.log('Image load time:', loadTime, 'ms');
      });

      img.addEventListener('error', () => {
        const loadTime = performance.now() - startTime;
        metricsRef.current.imageLoadTime.push(loadTime);
        //console.log('Image load failed:', loadTime, 'ms');
      });
    });
  }, []);

  // JavaScriptエラーの監視
  const observeErrors = useCallback(() => {
    const handleError = (event: ErrorEvent) => {
      metricsRef.current.errors.push({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        type: 'js',
      });
      //console.error('JavaScript error:', event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      metricsRef.current.errors.push({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        type: 'js',
      });
      //  console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // API応答時間の監視
  const observeAPI = useCallback(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const responseTime = performance.now() - startTime;
        metricsRef.current.apiResponseTime.push(responseTime);
        //console.log('API response time:', responseTime, 'ms');
        return response;
      } catch (error) {
        const responseTime = performance.now() - startTime;
        metricsRef.current.apiResponseTime.push(responseTime);
        metricsRef.current.errors.push({
          message: error instanceof Error ? error.message : 'API request failed',
          timestamp: Date.now(),
          type: 'api',
        });
        //console.error('API error:', error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // メトリクスの取得
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // メトリクスのリセット
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      apiResponseTime: [],
      imageLoadTime: [],
      errors: [],
    };
  }, []);

  // メトリクスのエクスポート
  const exportMetrics = useCallback(() => {
    const metrics = getMetrics();
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `performance-metrics-${Date.now()}.json`;
    link.click();
  }, [getMetrics]);

  useEffect(() => {
    // パフォーマンス監視の開始
    observeCoreWebVitals();
    observeTTFB();
    observeImageLoad();
    const cleanupErrors = observeErrors();
    const cleanupAPI = observeAPI();

    return () => {
      // クリーンアップ
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      cleanupErrors();
      cleanupAPI();
    };
  }, [observeCoreWebVitals, observeTTFB, observeImageLoad, observeErrors, observeAPI]);

  return {
    getMetrics,
    resetMetrics,
    exportMetrics,
  };
}

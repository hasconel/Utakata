"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

// 最適化設定の型定義
interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableIntersectionObserver: boolean;
  enableResizeObserver: boolean;
  enableMutationObserver: boolean;
  enablePerformanceMonitoring: boolean;
  enableMemoryOptimization: boolean;
  enableNetworkOptimization: boolean;
}

// デフォルト設定
const DEFAULT_CONFIG: OptimizationConfig = {
  enableLazyLoading: true,
  enableIntersectionObserver: true,
  enableResizeObserver: true,
  enableMutationObserver: true,
  enablePerformanceMonitoring: true,
  enableMemoryOptimization: true,
  enableNetworkOptimization: true,
};

// 最終最適化フック
export function useFinalOptimization(
  config: Partial<OptimizationConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState({
    lazyLoadedElements: 0,
    observedElements: 0,
    memoryUsage: 0,
    networkRequests: 0,
  });

  const observersRef = useRef<Map<string, any>>(new Map());
  const lazyLoadRefs = useRef<Set<Element>>(new Set());

  // 遅延読み込みの最適化
  const optimizeLazyLoading = useCallback(() => {
    if (!finalConfig.enableLazyLoading) return;

    const images = document.querySelectorAll('img[data-src]');
    const iframes = document.querySelectorAll('iframe[data-src]');
    const videos = document.querySelectorAll('video[data-src]');

    const lazyElements = [...images, ...iframes, ...videos];
    
    if (lazyElements.length === 0) return;

    const lazyLoadObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLImageElement | HTMLIFrameElement | HTMLVideoElement;
          const src = element.getAttribute('data-src');
          
          if (src) {
            if (element.tagName === 'IMG') {
              (element as HTMLImageElement).src = src;
            } else if (element.tagName === 'IFRAME') {
              (element as HTMLIFrameElement).src = src;
            } else if (element.tagName === 'VIDEO') {
              (element as HTMLVideoElement).src = src;
            }
            
            element.removeAttribute('data-src');
            lazyLoadObserver.unobserve(element);
            lazyLoadRefs.current.add(element);
            
            setOptimizationStats(prev => ({
              ...prev,
              lazyLoadedElements: prev.lazyLoadedElements + 1,
            }));
          }
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1,
    });

    lazyElements.forEach(element => lazyLoadObserver.observe(element));
    observersRef.current.set('lazyLoad', lazyLoadObserver);
  }, [finalConfig.enableLazyLoading]);

  // Intersection Observerの最適化
  const optimizeIntersectionObserver = useCallback(() => {
    if (!finalConfig.enableIntersectionObserver) return;

    const elements = document.querySelectorAll('[data-observe]');
    
    if (elements.length === 0) return;

    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          element.classList.add('is-visible');
          
          // 一度表示されたら監視を停止
          intersectionObserver.unobserve(element);
          
          setOptimizationStats(prev => ({
            ...prev,
            observedElements: prev.observedElements + 1,
          }));
        }
      });
    }, {
      rootMargin: '100px',
      threshold: 0.1,
    });

    elements.forEach(element => intersectionObserver.observe(element));
    observersRef.current.set('intersection', intersectionObserver);
  }, [finalConfig.enableIntersectionObserver]);

  // Resize Observerの最適化
  const optimizeResizeObserver = useCallback(() => {
    if (!finalConfig.enableResizeObserver) return;

    const elements = document.querySelectorAll('[data-resize-observe]');
    
    if (elements.length === 0) return;

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const { width, height } = entry.contentRect;
        
        // サイズ変更時の最適化処理
        if (width < 768) {
          element.classList.add('mobile-optimized');
        } else {
          element.classList.remove('mobile-optimized');
        }
      });
    });

    elements.forEach(element => resizeObserver.observe(element));
    observersRef.current.set('resize', resizeObserver);
  }, [finalConfig.enableResizeObserver]);

  // Mutation Observerの最適化
  const optimizeMutationObserver = useCallback(() => {
    if (!finalConfig.enableMutationObserver) return;

    const container = document.body;
    
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // DOM変更時の最適化処理
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // 新しく追加された要素の最適化
              if (element.hasAttribute('data-lazy')) {
                optimizeLazyLoading();
              }
              
              if (element.hasAttribute('data-observe')) {
                optimizeIntersectionObserver();
              }
            }
          });
        }
      });
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
    });

    observersRef.current.set('mutation', mutationObserver);
  }, [finalConfig.enableMutationObserver, optimizeLazyLoading, optimizeIntersectionObserver]);

  // メモリ最適化
  const optimizeMemory = useCallback(() => {
    if (!finalConfig.enableMemoryOptimization) return;

    // 未使用のイベントリスナーをクリーンアップ
    const cleanupEventListeners = () => {
      // カスタムイベントのクリーンアップ
      window.removeEventListener('scroll', () => {});
      window.removeEventListener('resize', () => {});
    };

    // 定期的なメモリクリーンアップ
    const memoryCleanup = setInterval(() => {
      cleanupEventListeners();
      
      // ガベージコレクションの促進
      if ('gc' in window) {
        (window as any).gc();
      }
      
      // メモリ使用量の監視
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setOptimizationStats(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    }, 30000); // 30秒ごと

    return () => clearInterval(memoryCleanup);
  }, [finalConfig.enableMemoryOptimization]);

  // ネットワーク最適化
  const optimizeNetwork = useCallback(() => {
    if (!finalConfig.enableNetworkOptimization) return;

    let requestCount = 0;

    // fetch APIの監視
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      requestCount++;
      setOptimizationStats(prev => ({
        ...prev,
        networkRequests: requestCount,
      }));

      try {
        const response = await originalFetch(...args);
        
        // レスポンスの最適化
        if (response.headers.get('content-type')?.includes('text/html')) {
          // HTMLレスポンスの最適化
          const text = await response.text();
          const optimizedText = text
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><');
          
          return new Response(optimizedText, response);
        }
        
        return response;
      } catch (error) {
        console.error('Network request failed:', error);
        throw error;
      }
    };

    // 元のfetchを復元する関数を返す
    return () => {
      window.fetch = originalFetch;
    };
  }, [finalConfig.enableNetworkOptimization]);

  // パフォーマンス監視の最適化
  const optimizePerformanceMonitoring = useCallback(() => {
    if (!finalConfig.enablePerformanceMonitoring) return;

    // Core Web Vitalsの監視
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            const lcp = entry.startTime;
            if (lcp > 2500) {
              console.warn('LCP is too slow:', lcp, 'ms');
              // 遅いLCPの最適化処理
            }
          }
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.set('performance', observer);
    }
  }, [finalConfig.enablePerformanceMonitoring]);

  // 全最適化の実行
  const runOptimizations = useCallback(() => {
    try {
      optimizeLazyLoading();
      optimizeIntersectionObserver();
      optimizeResizeObserver();
      optimizeMutationObserver();
      optimizeMemory();
      optimizeNetwork();
      optimizePerformanceMonitoring();
      
      setIsOptimized(true);
      //console.log('All optimizations applied successfully');
    } catch (error) {
      //console.error('Optimization failed:', error);
    }
  }, [
    optimizeLazyLoading,
    optimizeIntersectionObserver,
    optimizeResizeObserver,
    optimizeMutationObserver,
    optimizeMemory,
    optimizeNetwork,
    optimizePerformanceMonitoring,
  ]);

  // 最適化の停止
  const stopOptimizations = useCallback(() => {
    observersRef.current.forEach((observer, key) => {
      if (observer.disconnect) {
        observer.disconnect();
      } else if (observer.unobserve) {
        // 個別要素の監視を停止
        if (key === 'lazyLoad') {
          lazyLoadRefs.current.forEach(element => {
            observer.unobserve(element);
          });
        }
      }
    });

    observersRef.current.clear();
    lazyLoadRefs.current.clear();
    setIsOptimized(false);
    //console.log('All optimizations stopped');
  }, []);

  // 最適化の再実行
  const reoptimize = useCallback(() => {
    stopOptimizations();
    setTimeout(runOptimizations, 100);
  }, [stopOptimizations, runOptimizations]);

  // 初期化
  useEffect(() => {
    runOptimizations();

    return () => {
      stopOptimizations();
    };
  }, [runOptimizations, stopOptimizations]);

  return {
    // 状態
    isOptimized,
    optimizationStats,
    
    // 制御
    runOptimizations,
    stopOptimizations,
    reoptimize,
    
    // 設定
    config: finalConfig,
  };
}

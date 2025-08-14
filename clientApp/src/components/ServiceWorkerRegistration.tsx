"use client";

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          //console.log('Service Worker registered successfully:', registration);
          
          // 更新の確認
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新しいService Workerが利用可能
                  //console.log('New Service Worker available');
                  // ここでユーザーに更新を促す通知を表示可能
                }
              });
            }
          });
          
          // プッシュ通知の許可要求は削除（ユーザーアクション時に要求する）
          //console.log('Service Worker registered, notification permission will be requested on user action');
          
        } catch (error) {
          //console.error('Service Worker registration failed:', error);
        }
      };
      
      registerSW();
    }
  }, []);

  return null; // このコンポーネントは何もレンダリングしない
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function BroadcasterPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Socket.io接続
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ;
    socketRef.current = io(signalingUrl!);
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      socketRef.current?.emit('broadcaster');
    });

    socketRef.current.on('broadcaster-confirmed', () => {
      console.log('Broadcaster role confirmed');
    });

    socketRef.current.on('new-listener', (listenerId: string) => {
      console.log('New listener:', listenerId);
      setListenerCount(prev => prev + 1);
      createPeerConnection(listenerId);
    });

    socketRef.current.on('listener-disconnected', (listenerId: string) => {
      console.log('Listener disconnected:', listenerId);
      setListenerCount(prev => prev - 1);
      peerConnectionsRef.current.delete(listenerId);
    });

    socketRef.current.on('answer', async (data: { answer: RTCSessionDescriptionInit, from: string }) => {
      const peerConnection = peerConnectionsRef.current.get(data.from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    });

    socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit, from: string }) => {
      const peerConnection = peerConnectionsRef.current.get(data.from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const createPeerConnection = async (listenerId: string) => {
    try {
      const peerConnection = new RTCPeerConnection(STUN_SERVERS);
      
      // ローカルストリームを追加
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      }

      // ICE候補を送信
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            target: listenerId,
            candidate: event.candidate
          });
        }
      };

      peerConnectionsRef.current.set(listenerId, peerConnection);

      // オファーを作成して送信
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('offer', {
          target: listenerId,
          offer: offer
        });
      }
    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError('Failed to create peer connection');
    }
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      localStreamRef.current = stream;
      setIsStreaming(true);
      setError(null);
      
      console.log('Streaming started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopStreaming = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // 全PeerConnectionを閉じる
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    setIsStreaming(false);
    setListenerCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          WebRTC 配信者
        </h1>
        
        <div className="space-y-6">
          {/* 接続状態 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">接続状態:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>

          {/* 聴取者数 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">聴取者数:</span>
            <span className="text-2xl font-bold text-blue-600">{listenerCount}</span>
          </div>

          {/* 配信状態 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">配信状態:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              isStreaming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isStreaming ? '配信中' : '停止中'}
            </span>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex gap-4">
            <button
              onClick={startStreaming}
              disabled={!isConnected || isStreaming}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              配信開始
            </button>
            <button
              onClick={stopStreaming}
              disabled={!isStreaming}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              配信停止
            </button>
          </div>

          {/* 注意事項 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">注意事項:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• HTTPS環境での動作を推奨します</li>
              <li>• マイクの使用許可が必要です</li>
              <li>• 複数タブでテスト可能です</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

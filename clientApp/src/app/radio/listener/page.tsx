'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function ListenerPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // Socket.io接続
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ;
    socketRef.current = io(signalingUrl);
    
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      socketRef.current?.emit('listener');
    });

    socketRef.current.on('offer', async (data: { offer: RTCSessionDescriptionInit, from: string }) => {
      console.log('Received offer from:', data.from);
      await handleOffer(data.offer, data.from);
    });

    socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit, from: string }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    });

    socketRef.current.on('broadcaster-disconnected', () => {
      console.log('Broadcaster disconnected');
      setIsListening(false);
      setError('配信が終了しました');
    });

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      socketRef.current?.disconnect();
    };
  }, []);

  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    try {
      // PeerConnectionを作成
      peerConnectionRef.current = new RTCPeerConnection(STUN_SERVERS);

      // 音声トラックを受信
      peerConnectionRef.current.ontrack = (event) => {
        console.log('Received audio track');
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.play().catch(console.error);
          setIsListening(true);
          setError(null);
        }
      };

      // ICE候補を送信
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            target: from,
            candidate: event.candidate
          });
        }
      };

      // オファーを設定
      await peerConnectionRef.current.setRemoteDescription(offer);

      // アンサーを作成して送信
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('answer', {
          target: from,
          answer: answer
        });
      }
    } catch (err) {
      console.error('Error handling offer:', err);
      setError('接続に失敗しました');
    }
  };

  const stopListening = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    
    setIsListening(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          WebRTC 聴取者
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

          {/* 聴取状態 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-medium">聴取状態:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              isListening ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isListening ? '聴取中' : '待機中'}
            </span>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* 音声プレーヤー */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">音声プレーヤー</h3>
            <audio
              ref={audioRef}
              controls
              className="w-full"
              autoPlay
            >
              お使いのブラウザは音声再生をサポートしていません。
            </audio>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-4">
            <button
              onClick={stopListening}
              disabled={!isListening}
              className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              聴取停止
            </button>
          </div>

          {/* 注意事項 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">注意事項:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 配信者が配信を開始すると自動的に接続されます</li>
              <li>• 音声の自動再生が無効な場合、手動で再生してください</li>
              <li>• HTTPS環境での動作を推奨します</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

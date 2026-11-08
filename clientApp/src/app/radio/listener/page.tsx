'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Play, Pause } from 'lucide-react';
import { getActorByUserId } from '@/lib/appwrite/database';
import { ActivityPubActor } from '@/types/activitypub';
import { Avatar } from '@/components/ui/Avatar';

export default function ListenerPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [broadcaster, setBroadcaster] = useState<ActivityPubActor | null>(null);
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
    const fetchBroadcaster = async (broadcasterId: string) => {
      if(broadcasterId){
        setBroadcaster(await getActorByUserId(broadcasterId));
      }
    };
    // Socket.io接続
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ;
    socketRef.current = io(signalingUrl);
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current?.emit('listener');  
    });

    socketRef.current.on('broadcaster-id', (id: string) => {
      fetchBroadcaster(id);
    });

    socketRef.current.on('offer', async (data: { offer: RTCSessionDescriptionInit, from: string }) => {
      await handleOffer(data.offer, data.from);
    });

    socketRef.current.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit, from: string }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate);
      }
    });

    socketRef.current.on('broadcaster-disconnected', () => {
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
    
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto bg-card rounded-3xl shadow-soft p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          ラジオを聞く<span className="text-transparent bg-clip-text bg-primary">✨️</span>
        </h1>
        
        <div className="space-y-6">
          {/* 接続状態 */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <span className="font-medium">接続状態:</span>
            <span className={`px-3 py-1 rounded-full w-18 text-center text-sm ${
              isConnected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>


          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {/* 音声プレーヤー */}
          <div className="p-4 bg-secondary rounded-lg">
            <h3 className="font-medium mb-2 text-foreground ">現在の配信者<span className="text-transparent bg-clip-text bg-muted">✨️</span></h3>
            <div className="flex items-center w-full justify-between gap-2 xl:flex-row flex-col">
              <div className="flex justify-start w-full items-center gap-2 ">
            <audio
              ref={audioRef}
              controls
              className="hidden"
              autoPlay
            >
              お使いのブラウザは音声再生をサポートしていません。
            </audio>
            <button 
            disabled={!isListening}
            onClick={()=>{
              if(audioRef.current){
              if(audioRef.current.paused){
                audioRef.current.play();
                setIsPlaying(true);
              }else{
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
              }
            }}
            className="flex items-center justify-center w-10 h-10 bg-primary p-2 rounded-full disabled:bg-muted disabled:cursor-not-allowed"
            >
              {!isPlaying ? <Play className="w-10 h-10 text-primary disabled:text-muted-foreground disabled:cursor-not-allowed" /> : <Pause className="w-10 h-10 text-primary disabled:text-muted-foreground disabled:cursor-not-allowed" />}
            </button>
            {broadcaster && (
                          <div className="flex items-center gap-2 p-2 min-w-64 rounded-lg hover:bg-secondary/50">
             
                          <Avatar
                            src={broadcaster.icon?.url || ""}
                            alt={broadcaster.preferredUsername}
                            fallback={broadcaster.preferredUsername?.charAt(0)}
                            size="md"
                            variant="outline"
                          />
                          <div className="flex flex-col">
                            <span className="text-foreground">{broadcaster.displayName}</span>
                            <span className="text-muted-foreground">@{broadcaster.preferredUsername}</span>
                          </div>
                      </div>
            )}</div>
            <span className={`px-3 py-1 rounded-full w-18 text-center text-sm shrink-0 ${
              isListening ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {isListening ? '配信中' : '待機中'}
            </span></div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-4">
            <button
              onClick={stopListening}
              disabled={!isListening}
              className="flex-1 bg-destructive text-white py-3 px-6 rounded-lg font-medium hover:bg-destructive/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
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

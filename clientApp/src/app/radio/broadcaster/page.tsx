'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/useAuth';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { ActivityPubActor } from '@/types/activitypub';
import { getActorByUserId } from '@/lib/appwrite/database';
import { Avatar } from '@/components/ui/Avatar';

export default function BroadcasterPage() {
  const { user ,isLoading} = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [listenerCount, setListenerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isBroadcasterActive, setIsBroadcasterActive] = useState(false);
  const router = useRouter();
  const [broadcaster, setBroadcaster] = useState<ActivityPubActor | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  const fetchBroadcaster = async (userId: string) => {
    if(userId){
      setBroadcaster(await getActorByUserId(userId));
    }
  };

  const handleKillBroadcaster = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    killBroadcaster(password);
  };

  const killBroadcaster = (password: string) => {
    if (socketRef.current ) {
      socketRef.current.emit('broadcaster-disconnect', password);
    }
  };

  useEffect(() => {
    if(!user){
      if(!isLoading){
        router.push('/login');
      }
      return ;
    }
    // Socket.io接続
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ;
    socketRef.current = io(signalingUrl!);
    socketRef.current.on('connect', async () => {
      setIsConnected(true);
      // 既存のbroadcasterをチェック（本人確認用のトークンを添えて参加する）
      try {
        const res = await fetch('/api/radio/token', { method: 'POST' });
        if (!res.ok) throw new Error('token request failed');
        const { jwt } = await res.json();
        socketRef.current?.emit('broadcaster', { jwt });
      } catch {
        setError('配信者の本人確認に失敗しました');
      }
    });
    

    socketRef.current.on('broadcaster-confirmed', () => {
      setIsBroadcasterActive(true);
      setError(null);
    });

    socketRef.current.on('rejected-password', (reason: string) => {
      setError(`管理者パスワードが間違っています: ${reason}`);
      setIsBroadcasterActive(false);
    });

    socketRef.current.on('broadcaster-rejected', (reason: string) => {
      setError(`配信者として接続できません: ${reason}`);
      stopStreaming();
      socketRef.current?.disconnect();
      setIsBroadcasterActive(false);

    });

    socketRef.current.on('broadcaster-exists', (userId: string) => {
      setIsBroadcasterActive(false);
      fetchBroadcaster(userId);
       });

    socketRef.current.on('new-listener', (listenerId: string) => {
      setListenerCount(prev => prev + 1);
      createPeerConnection(listenerId);
    });

    socketRef.current.on('listener-disconnected', (listenerId: string) => {
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
      // クリーンアップ時にbroadcaster権限を解放
      if (socketRef.current && isBroadcasterActive) {
        socketRef.current.emit('broadcaster-disconnect');
      }
      socketRef.current?.disconnect();
    };
  }, [user,isLoading]);

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
    if (!isBroadcasterActive) {
      setError('配信者として認証されていません');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      localStreamRef.current = stream;
      setIsStreaming(true);
      setError(null);
      
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

  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  if(!user && !isLoading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>ログインしてください</div>
      </div>
    );
  }
  if(user && !isLoading && isConnected){
    return (
      <div className="flex items-center  min-h-screen flex-col">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">ラジオ配信<span className="text-transparent bg-clip-text bg-primary">✨️</span></h1>

{isBroadcasterActive && 
<div className="flex items-center p-4 rounded-lg">
              {isStreaming ? 
            <button onClick={stopStreaming}>
              <ToggleRight className="w-10 h-10 text-success" /> 
              </button> : 
              <button onClick={startStreaming}>
                <ToggleLeft className="w-10 h-10 text-orange-500" /> 
                </button>}
                
</div>
}
{isBroadcasterActive && isStreaming &&
<div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
  {listenerCount}人が聞いてくれているみたい✨️
</div>
}

                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/40 text-destructive rounded-lg">
                    {error}

                  </div>
                )}
                {broadcaster && (                         <div className="flex gap-4 flex-col"> <div className="flex items-center gap-2 p-2 min-w-64 rounded-lg hover:bg-secondary/50">
             
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


              
         <div className="flex gap-4">
                  <form onSubmit={handleKillBroadcaster} className="flex gap-2 justify-between">
                    <textarea id="password" className="w-full p-2 border border-border rounded-lg" placeholder="管理者パスワード" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="bg-destructive text-white p-2 rounded-lg" type="submit">配信者切断</button>
                  </form>
                </div>  
                </div>)}
      </div>
    );
  }
  if(!isConnected){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>サーバーに接続できていないみたい</div>
      </div>
    );
  }
  return (
    <div>
      <h1>BroadcasterPage</h1>
    </div>
  );
}

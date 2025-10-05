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
    console.log('password',password);
    killBroadcaster(password);
  };

  const killBroadcaster = (password: string) => {
    if (socketRef.current ) {
      socketRef.current.emit('broadcaster-disconnect', password);
    }
  };

  useEffect(() => {
    if(!user && !isLoading){
      console.log('user not found');
      router.push('/login');
      return ;
    }
    // Socket.io接続
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL ;
    socketRef.current = io(signalingUrl!);
    console.log('signalingUrl',signalingUrl);
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setIsConnected(true);
      // 既存のbroadcasterをチェック
      socketRef.current?.emit('broadcaster',user?.$id);
    });
    

    socketRef.current.on('broadcaster-confirmed', () => {
      console.log('Broadcaster role confirmed');
      setIsBroadcasterActive(true);
      setError(null);
    });

    socketRef.current.on('rejected-password', (reason: string) => {
      console.log('Rejected password:', reason);
      setError(`管理者パスワードが間違っています: ${reason}`);
      setIsBroadcasterActive(false);
    });

    socketRef.current.on('broadcaster-rejected', (reason: string) => {
      console.log('Broadcaster role rejected:', reason);
      setError(`配信者として接続できません: ${reason}`);
      stopStreaming();
      socketRef.current?.disconnect();
      setIsBroadcasterActive(false);

    });

    socketRef.current.on('broadcaster-exists', (userId: string) => {
      console.log('Another broadcaster already exists');
      setIsBroadcasterActive(false);
      fetchBroadcaster(userId);
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

  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-pink-500">ラジオ配信<span className="text-transparent bg-clip-text bg-purple-500 dark:bg-pink-500">✨️</span></h1>

{isBroadcasterActive && 
<div className="flex items-center p-4 rounded-lg">
              {isStreaming ? 
            <button onClick={stopStreaming}>
              <ToggleRight className="w-10 h-10 text-green-500" /> 
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
                  <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}

                  </div>
                )}
                {broadcaster && (                         <div className="flex gap-4 flex-col"> <div className="flex items-center gap-2 p-2 min-w-64 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500/50">
             
             <Avatar
               src={broadcaster.icon?.url || ""}
               alt={broadcaster.preferredUsername}
               fallback={broadcaster.preferredUsername?.charAt(0)}
               size="md"
               variant="outline"
             />
             <div className="flex flex-col">
               <span className="text-gray-900 dark:text-gray-100">{broadcaster.displayName}</span>
               <span className="text-gray-500 dark:text-gray-400">@{broadcaster.preferredUsername}</span>
             </div>
         </div>


              
         <div className="flex gap-4">
                  <form onSubmit={handleKillBroadcaster} className="flex gap-2 justify-between">
                    <textarea id="password" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="管理者パスワード" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button className="bg-red-500 text-white p-2 rounded-lg" type="submit">配信者切断</button>
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

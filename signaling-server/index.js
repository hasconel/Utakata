const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const express = require('express');
const path = require('path');
const crypto = require('crypto');

// 許可するドメインのリスト
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN ,
].filter(origin => origin); // undefined/nullを除外

console.log('Allowed CORS origins:', allowedOrigins);

const app = express();

// CORSミドルウェアを追加
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log('Request from origin:', origin, '- Allowed:', allowedOrigins.includes(origin));
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    console.log('CORS blocked! Origin not in allowed list:', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const server = http.createServer(app);

// 死活確認用（curl で応答を見る用）
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'signaling-server' });
});

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // originがundefinedの場合は許可（モバイルアプリなど）
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  allowEIO3: true
});

// 配信者と聴取者を管理
let broadcaster = null;
const listeners = new Set();

// 管理者パスワードの照合（未設定なら常に失敗させる）
function isAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string') return false;
  const hash = (value) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(hash(password), hash(expected));
}

// JWTをAppwriteに問い合わせてユーザーIDを確認する（確認できなければ null）
async function verifyUserId(jwt) {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  if (!endpoint || !project || typeof jwt !== 'string' || !jwt) return null;
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/account`, {
      headers: { 'X-Appwrite-Project': project, 'X-Appwrite-JWT': jwt },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const account = await res.json();
    return typeof account.$id === 'string' ? account.$id : null;
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
}

// シグナリングの転送は「配信者と聴取者の間」だけ許可する
function canRelay(socket, data) {
  if (!data || typeof data.target !== 'string' || !broadcaster) return false;
  if (socket.id === broadcaster.id) return listeners.has(data.target);
  return data.target === broadcaster.id && listeners.has(socket.id);
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 配信者として参加
  socket.on('broadcaster', async (credentials) => {
    if (broadcaster) {
      socket.emit('broadcaster-exists', broadcaster.userId);
      return;
    }
    const userId = await verifyUserId(credentials?.jwt);
    if (!userId) {
      socket.emit('broadcaster-rejected', '配信者の本人確認に失敗しました');
      return;
    }
    // 確認を待っている間に状況が変わっていないか見直す
    if (!socket.connected) return;
    if (broadcaster) {
      socket.emit('broadcaster-exists', broadcaster.userId);
      return;
    }
    broadcaster = { id: socket.id, userId };
    console.log('Broadcaster connected:', socket.id, 'userId:', userId);
    socket.emit('broadcaster-confirmed', userId);
  });

  // 聴取者として参加
  socket.on('listener', () => {
    listeners.add(socket.id);
    console.log('Listener connected:', socket.id);
    
    // 配信者がいる場合、オファーを送信
    if (broadcaster) {
      socket.emit('broadcaster-id', broadcaster.userId);
      console.log('ListenerがBroadcasterに接続しました:', broadcaster.id,"userId:",broadcaster.userId);
      socket.to(broadcaster.id).emit('new-listener', socket.id);
    }
  });

  // SDPオファーを配信者から聴取者へ転送
  socket.on('offer', (data) => {
    if (!canRelay(socket, data)) return;
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  // SDPアンサーを聴取者から配信者へ転送
  socket.on('answer', (data) => {
    if (!canRelay(socket, data)) return;
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  // ICE候補を転送
  socket.on('ice-candidate', (data) => {
    if (!canRelay(socket, data)) return;
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // 接続切断時の処理
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    console.log('broadcaster:',broadcaster);
    if (broadcaster && broadcaster.id === socket.id) {
      broadcaster = null;
      // 全聴取者に配信終了を通知
      listeners.forEach(listenerId => {
        io.to(listenerId).emit('broadcaster-disconnected');
      });
    } else {
      listeners.delete(socket.id);
      // 配信者に聴取者切断を通知
      if (broadcaster) {
        socket.to(broadcaster.id).emit('listener-disconnected', socket.id);
      }
    }
  });

  // 管理者用:配信者切断
  socket.on('broadcaster-disconnect', (password) => {
    // 配信者本人による終了
    if (broadcaster && socket.id === broadcaster.id) {
      console.log('配信者によって配信者が切断されました');
      listeners.forEach(listenerId => {
        io.to(listenerId).emit('broadcaster-disconnected');
      });
      broadcaster = null;
      return;
    }
    if (!isAdminPassword(password)) {
      socket.emit('rejected-password', '管理者パスワードが間違っています');
      return;
    }
    console.log('管理者によって配信者が切断されました');
    if (broadcaster) {
      io.to(broadcaster.id).emit('broadcaster-rejected', '管理者によって配信者が切断されました');
    }
    listeners.forEach(listenerId => {
      io.to(listenerId).emit('broadcaster-disconnected');
    });
    broadcaster = null;
  });
});

const PORT = process.env.PORT || 6150;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
    console.error('You can kill the process with: lsof -ti:6150 | xargs kill -9');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

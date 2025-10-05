const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();
const http = require('http');
const express = require('express');
const path = require('path');

// 許可するドメインのリスト
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
];

const app = express();

// CORSミドルウェアを追加
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
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

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 配信者として参加
  socket.on('broadcaster',(userId)  => {
    if (broadcaster) {
      socket.emit('broadcaster-exists', broadcaster.userId);
    } else {   
      if(userId){
           
    broadcaster = {
      id:socket.id,
      userId:userId
    };
    console.log('Broadcaster connected:', socket.id,'userId:',userId);
    socket.emit('broadcaster-confirmed',userId);
    }
    else{
      socket.emit('broadcaster-rejected','配信者idが存在しません');
    }
    }
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
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  // SDPアンサーを聴取者から配信者へ転送
  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  // ICE候補を転送
  socket.on('ice-candidate', (data) => {
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
  socket.on('broadcaster-disconnect',(password) => {
    console.log("broadcaster-disconnect",socket.id,broadcaster.id,password);
    if(socket.id === broadcaster.id){
      console.log("配信者によって配信者が切断されました");
      listeners.forEach(listenerId => {
        io.to(listenerId).emit('broadcaster-disconnected');
      });
      broadcaster = null;
    }
    if(password == process.env.ADMIN_PASSWORD) {
      console.log("管理者によって配信者が切断されました");
      if(broadcaster && broadcaster.id){
            
    io.to(broadcaster.id).emit('broadcaster-rejected','管理者によって配信者が切断されました');

    }
    listeners.forEach(listenerId => {
      io.to(listenerId).emit('broadcaster-disconnected');
    });
    broadcaster = null;
  }else{
    socket.emit('rejected-password','管理者パスワードが間違っています');
  }
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

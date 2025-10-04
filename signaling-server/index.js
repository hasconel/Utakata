const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 配信者と聴取者を管理
let broadcaster = null;
const listeners = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 配信者として参加
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    console.log('Broadcaster connected:', socket.id);
    socket.emit('broadcaster-confirmed');
  });

  // 聴取者として参加
  socket.on('listener', () => {
    listeners.add(socket.id);
    console.log('Listener connected:', socket.id);
    
    // 配信者がいる場合、オファーを送信
    if (broadcaster) {
      socket.to(broadcaster).emit('new-listener', socket.id);
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
    
    if (broadcaster === socket.id) {
      broadcaster = null;
      // 全聴取者に配信終了を通知
      listeners.forEach(listenerId => {
        io.to(listenerId).emit('broadcaster-disconnected');
      });
    } else {
      listeners.delete(socket.id);
      // 配信者に聴取者切断を通知
      if (broadcaster) {
        socket.to(broadcaster).emit('listener-disconnected', socket.id);
      }
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

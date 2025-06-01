import { io } from 'socket.io-client';

console.log('Testing WebSocket connection to experiment server...');

const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const timeout = setTimeout(() => {
  console.log('❌ Connection timeout - WebSocket not working');
  process.exit(1);
}, 10000);

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server successfully!');
  console.log('Socket ID:', socket.id);
  clearTimeout(timeout);
  
  // Test subscribing to a dummy experiment
  socket.emit('subscribe', 'test-experiment-id');
});

socket.on('subscribed', (data) => {
  console.log('✅ Successfully subscribed to experiment:', data.experimentId);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket connection error:', error.message);
  clearTimeout(timeout);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected from WebSocket:', reason);
});

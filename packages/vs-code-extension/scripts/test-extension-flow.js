import { io } from 'socket.io-client';

console.log('🧪 Testing VS Code Extension WebSocket Flow...\n');

class MockExperimentService {
  constructor() {
    this.socket = null;
    this.activeExperiments = new Map();
  }

  async connect() {
    const serverUrl = 'http://localhost:3000';
    console.log(`📡 Attempting to connect to WebSocket at: ${serverUrl}`);

    // If already connected, don't reconnect
    if (this.socket && this.socket.connected) {
      console.log('✅ Already connected to WebSocket');
      return;
    }

    this.socket = io(serverUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Return a promise that resolves when connected or rejects on error
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 second timeout

      this.socket.on('connect', () => {
        console.log('✅ Connected to ExtremeXP server');
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.log('❌ WebSocket connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from ExtremeXP server');
      });

      this.socket.on('subscribed', (data) => {
        console.log(`✅ Subscribed to experiment: ${data.experimentId}`);
      });

      this.socket.on('progress', (data) => {
        console.log('📊 Received progress event:', {
          experimentId: data.experimentId,
          taskIndex: data.taskIndex,
          spaceIndex: data.spaceIndex,
          status: data.status,
          message: data.message
        });
      });

      this.socket.on('complete', (data) => {
        console.log('🎉 Experiment completed:', data.experimentId);
        this.activeExperiments.delete(data.experimentId);
        this.socket?.emit('unsubscribe', data.experimentId);
      });

      this.socket.on('error', (data) => {
        console.log('❌ Experiment error:', data);
        this.activeExperiments.delete(data.experimentId);
        this.socket?.emit('unsubscribe', data.experimentId);
      });
    });
  }

  async startExperiment(artifactPath) {
    const serverUrl = 'http://localhost:3000';
    
    console.log('\n🚀 Starting experiment...');

    // Ensure WebSocket connection is established
    if (!this.socket || !this.socket.connected) {
      console.log('🔄 WebSocket not connected, attempting to connect...');
      await this.connect();
    }

    // Make API call to start experiment
    console.log('📤 Sending API request to start experiment...');
    const response = await fetch(`${serverUrl}/api/experiments/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artifactPath,
        resume: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start experiment');
    }

    const data = await response.json();
    const experimentId = data.experimentId;
    console.log(`✅ Experiment started with ID: ${experimentId}`);

    // Register experiment for tracking
    this.activeExperiments.set(experimentId, { 
      onProgress: (progress) => console.log('📈 Progress callback triggered:', progress),
      onComplete: (result) => console.log('🏁 Complete callback triggered:', result),
      onError: (error) => console.log('💥 Error callback triggered:', error)
    });

    // Subscribe to updates - connection should be established by now
    if (this.socket && this.socket.connected) {
      console.log(`📡 Subscribing to experiment: ${experimentId}`);
      this.socket.emit('subscribe', experimentId);
    } else {
      console.log('❌ No socket connection available for subscription');
      throw new Error('WebSocket connection not available');
    }

    return experimentId;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeExperiments.clear();
  }
}

async function testFlow() {
  const service = new MockExperimentService();
  
  try {
    // Test the complete flow
    const experimentId = await service.startExperiment('d:/repos/xxp-tooling-v2/test-files/artifact.json');
    
    console.log(`\n⏳ Waiting for progress events for experiment ${experimentId}...`);
    console.log('💡 If you see progress events above, the WebSocket connection is working!\n');
    
    // Keep the connection alive for a while to receive progress events
    setTimeout(() => {
      console.log('\n🧹 Cleaning up and disconnecting...');
      service.disconnect();
      console.log('✅ Test completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   - WebSocket connection: ✅ Working');
      console.log('   - Experiment subscription: ✅ Working');
      console.log('   - Progress events: Check above for "📊 Received progress event" messages');
      process.exit(0);
    }, 15000); // Wait 15 seconds for progress events
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    service.disconnect();
    process.exit(1);
  }
}

testFlow();

const { io } = require('socket.io-client');
const http = require('http');

async function testProgressTracking() {
    console.log('Testing Progress Tracking via WebSocket...');
    
    try {
        // Connect to the experiment runner server
        const socket = io('http://localhost:3000', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        return new Promise((resolve, reject) => {
            let progressCount = 0;
            const progressUpdates = [];
            
            // Set up timeout
            const timeout = setTimeout(() => {
                console.log('Test timeout reached');
                console.log(`Progress updates received: ${progressCount}`);
                if (progressCount > 0) {
                    console.log('✅ SUCCESS: Progress updates were received (timeout)');
                    resolve(true);
                } else {
                    console.log('❌ FAILURE: No progress updates received (timeout)');
                    resolve(false);
                }
                socket.disconnect();
            }, 30000); // 30 second timeout

            socket.on('connect', async () => {
                console.log('Connected to server');
                
                // Subscribe to experiment progress
                const experimentId = 'E1_1.1_' + Date.now();
                socket.emit('subscribe', experimentId);
                
                // Start experiment via HTTP API
                const postData = JSON.stringify({
                    artifactPath: 'd:/repos/xxp-tooling-v2/test-files/artifact.json',
                    experimentId: experimentId
                });
                
                const options = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/experiments/run',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                console.log('Starting experiment via HTTP API...');
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        console.log('Experiment start response:', data);
                    });
                });

                req.on('error', (e) => {
                    console.error('Request error:', e);
                    clearTimeout(timeout);
                    reject(e);
                });

                req.write(postData);
                req.end();
            });

            socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                clearTimeout(timeout);
                reject(error);
            });

            socket.on('subscribed', (data) => {
                console.log('Subscribed to experiment:', data.experimentId);
            });

            socket.on('progress', (data) => {
                progressCount++;
                progressUpdates.push(data);
                console.log(`Progress Update #${progressCount}:`, {
                    experimentId: data.experimentId,
                    percentage: Math.round(data.progress.percentage * 100),
                    currentSpace: data.currentSpace,
                    currentTask: data.currentTask,
                    completedSpaces: data.progress.completedSpaces,
                    totalSpaces: data.progress.totalSpaces,
                    completedTasks: data.progress.completedTasks,
                    totalTasks: data.progress.totalTasks,
                    status: data.status,
                    message: data.message
                });
            });

            socket.on('complete', (data) => {
                clearTimeout(timeout);
                console.log('Experiment completed!', {
                    experimentId: data.experimentId,
                    totalProgressUpdates: progressCount
                });
                
                if (progressCount > 0) {
                    console.log('✅ SUCCESS: Progress updates were received!');
                    console.log(`Total progress updates: ${progressCount}`);
                    
                    // Show first and last few updates
                    console.log('First 3 updates:', progressUpdates.slice(0, 3).map(p => ({
                        percentage: Math.round(p.progress.percentage * 100),
                        message: p.message
                    })));
                    console.log('Last 3 updates:', progressUpdates.slice(-3).map(p => ({
                        percentage: Math.round(p.progress.percentage * 100),
                        message: p.message
                    })));
                    resolve(true);
                } else {
                    console.log('❌ FAILURE: No progress updates received');
                    resolve(false);
                }
                
                socket.disconnect();
            });

            socket.on('error', (data) => {
                clearTimeout(timeout);
                console.error('Experiment failed:', data);
                console.log(`Progress updates received before error: ${progressCount}`);
                socket.disconnect();
                resolve(progressCount > 0);
            });
        });
        
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}

testProgressTracking().then(success => {
    process.exit(success ? 0 : 1);
});

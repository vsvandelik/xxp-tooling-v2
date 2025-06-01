const vscode = require('vscode');
const { ExperimentService } = require('../dist/services/ExperimentService.js');
const { ServerManager } = require('../dist/services/ServerManager.js');
const { ProgressPanel } = require('../dist/panels/ProgressPanel.js');

async function testProgressPanel() {
    console.log('Testing Progress Panel with real experiment...');
    
    try {
        // Mock VS Code context
        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            extensionPath: process.cwd()
        };

        // Create services
        const serverManager = new ServerManager(mockContext);
        const experimentService = new ExperimentService(serverManager);
        
        // Start server if not running
        console.log('Starting server...');
        await serverManager.start();
        
        // Wait a bit for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Running experiment with progress tracking...');
        
        // Run experiment with callbacks to monitor progress
        const experimentId = 'E1_1.1_' + Date.now();
        const artifactPath = 'd:/repos/xxp-tooling-v2/test-files/artifact.json';
        
        let progressCount = 0;
        const progressUpdates = [];
        
        const callbacks = {
            onProgress: (progress) => {
                progressCount++;
                progressUpdates.push(progress);
                console.log(`Progress Update #${progressCount}:`, {
                    percentage: Math.round(progress.progress.percentage * 100),
                    currentSpace: progress.currentSpace,
                    currentTask: progress.currentTask,
                    completedSpaces: progress.progress.completedSpaces,
                    totalSpaces: progress.progress.totalSpaces,
                    completedTasks: progress.progress.completedTasks,
                    totalTasks: progress.progress.totalTasks,
                    status: progress.status
                });
            },
            onComplete: (result) => {
                console.log('Experiment completed!', {
                    totalProgressUpdates: progressCount,
                    finalResult: result
                });
                
                // Verify we got multiple progress updates
                if (progressCount > 0) {
                    console.log('✅ SUCCESS: Progress updates were received!');
                    console.log(`Total progress updates: ${progressCount}`);
                    
                    // Show first and last few updates
                    console.log('First 3 updates:', progressUpdates.slice(0, 3));
                    console.log('Last 3 updates:', progressUpdates.slice(-3));
                } else {
                    console.log('❌ FAILURE: No progress updates received');
                }
                
                process.exit(0);
            },
            onError: (error) => {
                console.error('Experiment failed:', error);
                console.log(`Progress updates received before error: ${progressCount}`);
                process.exit(1);
            }
        };
        
        // Start the experiment
        const response = await experimentService.runExperiment(artifactPath, experimentId, callbacks);
        console.log('Experiment started:', response);
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
            console.log('Test timeout reached');
            console.log(`Progress updates received: ${progressCount}`);
            if (progressCount > 0) {
                console.log('✅ SUCCESS: Progress updates were received (timeout)');
            } else {
                console.log('❌ FAILURE: No progress updates received (timeout)');
            }
            process.exit(progressCount > 0 ? 0 : 1);
        }, 30000); // 30 second timeout
        
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testProgressPanel();

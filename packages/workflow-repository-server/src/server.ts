import { WorkflowRepositoryServer, ServerConfig } from './server/WorkflowRepositoryServer.js';

const config: ServerConfig = {
  port: parseInt(process.env['PORT'] || '3001'),
  storagePath: process.env['STORAGE_PATH'] || './workflow-repository',
  jwtSecret: process.env['JWT_SECRET'] || 'your-secret-key-change-in-production',
  corsOrigin: process.env['CORS_ORIGIN'] || '*',
};

async function startServer(): Promise<void> {
  console.log('Starting Workflow Repository Server...');
  console.log('Configuration:', {
    port: config.port,
    storagePath: config.storagePath,
    corsOrigin: config.corsOrigin,
  });

  try {
    const server = new WorkflowRepositoryServer(config);
    await server.start();

    console.log('🚀 Server started successfully!');
    console.log(`📂 Storage path: ${config.storagePath}`);
    console.log(`🌐 Server URL: http://localhost:${config.port}`);
    console.log('📖 API Documentation:');
    console.log('  - GET  /health - Health check');
    console.log('  - POST /auth/login - Login');
    console.log('  - GET  /workflows - List workflows');
    console.log('  - POST /workflows - Upload workflow');
    console.log('  - GET  /tree - Browse repository tree');
    console.log('  - GET  /search - Search workflows');
    console.log('');
    console.log('Default admin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Failed to start server:', error.message);

      if (error.message.includes('already in use')) {
        console.log('');
        console.log('💡 Suggestions:');
        console.log('  1. Stop any existing server running on this port');
        console.log('  2. Use a different port: PORT=3002 npm start');
        console.log("  3. Check what's using the port: netstat -ano | findstr :3001");
      }
    } else {
      console.error('❌ Failed to start server:', error);
    }
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

startServer().catch(console.error);

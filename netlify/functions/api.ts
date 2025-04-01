import serverless from 'serverless-http';
import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { registerRoutes } from '../../server/routes';

// Create Express app instance
const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable X-Powered-By header
app.disable('x-powered-by');

// For Netlify functions environment, we don't need an actual HTTP server
// as Netlify will handle that, but we still create one for local development
const server = http.createServer(app);

// Let routes know this is running in Netlify Functions environment
if (process.env.NETLIFY) {
  console.log('Running in Netlify Functions environment');
}

// Register API routes without passing the server 
// to avoid websocket setup conflicts with Netlify
registerRoutes(app);

// In Netlify Functions, WebSockets are handled differently
// We'll only set up WebSockets for local development
if (!process.env.NETLIFY) {
  // Set up WebSocket server for local development
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
  });

  // Setup websocket connection events
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Echo back for testing
        ws.send(JSON.stringify({
          type: 'echo',
          data: data,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connected to local WebSocket server',
      timestamp: new Date().toISOString()
    }));
  });
}

// Custom error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Standalone version for dev testing
if (process.env.NODE_ENV === 'development' && !process.env.NETLIFY) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export handler for Netlify Functions
export const handler = serverless(app, {
  binary: true,
});
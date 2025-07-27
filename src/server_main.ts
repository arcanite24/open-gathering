import { Server } from './server/index';

/**
 * Entry point for the MTG Game Engine HTTP server.
 */
async function main() {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const server = new Server(port);

    try {
        await server.start();
        console.log('Server started successfully');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

main().catch(error => {
    console.error('Unhandled error in main:', error);
    process.exit(1);
});

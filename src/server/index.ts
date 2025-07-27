import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { GameSessionManager } from './game_session_manager';
import {
    CreateGameRequest,
    CreateGameResponse,
    GetGameStateResponse,
    SubmitActionRequest,
    SubmitActionResponse,
    ErrorResponse
} from './types';
import {
    apiRateLimit,
    gameCreationRateLimit,
    actionRateLimit,
    validateCreateGame,
    validateSubmitAction,
    handleValidationErrors,
    requestLogger,
    securityHeaders,
    validateGameId,
    validateContentType
} from './middleware';

/**
 * HTTP server that exposes the MTG game engine functionality via REST API.
 */
export class Server {
    private app: express.Application;
    private gameSessionManager: GameSessionManager;
    private port: number;
    private server: any;
    private isShuttingDown: boolean = false;

    constructor(port: number = 3000) {
        this.app = express();
        this.port = port;
        this.gameSessionManager = new GameSessionManager();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Sets up middleware for the Express app.
     */
    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // Custom security headers
        this.app.use(securityHeaders);

        // Request logging middleware
        this.app.use(requestLogger);

        // Rate limiting
        this.app.use(apiRateLimit);

        // CORS middleware
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production'
                ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
                : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Content-Type validation for JSON endpoints
        this.app.use(validateContentType);

        // Body parsing middleware with size limits
        this.app.use(express.json({
            limit: '1mb',
            strict: true
        }));
        this.app.use(express.urlencoded({
            extended: true,
            limit: '1mb'
        }));

        // Graceful shutdown middleware
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            if (this.isShuttingDown) {
                res.status(503).json({
                    error: 'Server is shutting down',
                    status: 503
                } as ErrorResponse);
                return;
            }
            next();
        });
    }

    /**
     * Sets up API routes.
     */
    private setupRoutes(): void {
        // Health check endpoint (no rate limiting)
        this.app.get('/health', (req: Request, res: Response) => {
            const sessionStats = this.gameSessionManager.getSessionStats();
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                activeSessions: sessionStats.activeSessions,
                memoryUsage: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // Server statistics endpoint
        this.app.get('/stats', (req: Request, res: Response) => {
            const sessionStats = this.gameSessionManager.getSessionStats();
            res.json(sessionStats);
        });

        // API routes with specific rate limiting
        this.app.post('/games',
            process.env.NODE_ENV !== 'test' ? gameCreationRateLimit : (req: Request, res: Response, next: NextFunction) => next(),
            validateCreateGame,
            handleValidationErrors,
            this.createGame.bind(this)
        );

        this.app.get('/games/:id',
            validateGameId,
            this.getGameState.bind(this)
        );

        this.app.post('/games/:id/actions',
            actionRateLimit,
            validateGameId,
            validateSubmitAction,
            handleValidationErrors,
            this.submitAction.bind(this)
        );

        // Get available card definitions (for debugging/testing)
        this.app.get('/cards', (req: Request, res: Response) => {
            const cardDefinitions = this.gameSessionManager.getCardDefinitions();
            const cards = Array.from(cardDefinitions.values());
            res.json({ cards });
        });

        // Administrative endpoints (could be protected with auth in production)
        if (process.env.NODE_ENV !== 'production') {
            this.app.get('/admin/sessions', (req: Request, res: Response) => {
                const stats = this.gameSessionManager.getSessionStats();
                const activeSessions = this.gameSessionManager.getSessionsByStatus('active');
                res.json({
                    stats,
                    activeSessions: activeSessions.map(s => ({
                        id: s.id,
                        createdAt: s.createdAt,
                        lastActivity: s.lastActivity,
                        playerIds: s.playerIds
                    }))
                });
            });
        }

        // 404 handler - must be last
        this.app.use((req: Request, res: Response) => {
            const error: ErrorResponse = {
                error: `Route ${req.originalUrl} not found`,
                status: 404
            };
            res.status(404).json(error);
        });
    }

    /**
     * Creates a new game.
     */
    private createGame(req: Request, res: Response, next: NextFunction): void {
        try {
            const { player1Deck, player2Deck }: CreateGameRequest = req.body;

            // Create the game session
            const session = this.gameSessionManager.createGame(player1Deck, player2Deck);

            const response: CreateGameResponse = {
                gameId: session.id,
                gameState: session.engine.getState()
            };

            console.log(`Game created: ${session.id} with decks of ${player1Deck.length} and ${player2Deck.length} cards`);
            res.status(201).json(response);
        } catch (error) {
            console.error('Error creating game:', error);
            next(error);
        }
    }

    /**
     * Gets the current game state.
     */
    private getGameState(req: Request, res: Response, next: NextFunction): void {
        try {
            const gameId = req.params.id;
            const session = this.gameSessionManager.getGame(gameId);

            if (!session) {
                const error: ErrorResponse = {
                    error: `Game with ID ${gameId} not found`,
                    status: 404
                };
                res.status(404).json(error);
                return;
            }

            const response: GetGameStateResponse = {
                gameState: session.engine.getState()
            };

            res.json(response);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submits an action to a game.
     */
    private submitAction(req: Request, res: Response, next: NextFunction): void {
        try {
            const gameId = req.params.id;
            const { playerId, action }: SubmitActionRequest = req.body;

            const session = this.gameSessionManager.getGame(gameId);
            if (!session) {
                const error: ErrorResponse = {
                    error: `Game with ID ${gameId} not found`,
                    status: 404
                };
                res.status(404).json(error);
                return;
            }

            // Check if game is still active
            if (session.status !== 'active') {
                const error: ErrorResponse = {
                    error: `Game ${gameId} is not active (status: ${session.status})`,
                    status: 400
                };
                res.status(400).json(error);
                return;
            }

            // Store the current state before the action
            const previousState = session.engine.getState();

            try {
                // Submit the action
                session.engine.submitAction(playerId, action);

                const response: SubmitActionResponse = {
                    gameState: session.engine.getState(),
                    success: true
                };

                console.log(`Action submitted for game ${gameId}: ${action.type} by ${playerId}`);
                res.json(response);
            } catch (actionError) {
                // If the action failed, return the previous state with an error
                const response: SubmitActionResponse = {
                    gameState: previousState,
                    success: false,
                    error: actionError instanceof Error ? actionError.message : 'Unknown action error'
                };

                res.status(400).json(response);
            }
        } catch (error) {
            next(error);
        }
    }

    /**
     * Sets up error handling middleware.
     */
    private setupErrorHandling(): void {
        // Global error handler - must be last middleware
        this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
            // Log error details
            console.error('Server error:', {
                message: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString()
            });

            // Handle specific error types
            if (error.type === 'entity.parse.failed') {
                const errorResponse: ErrorResponse = {
                    error: 'Invalid JSON in request body',
                    status: 400
                };
                res.status(400).json(errorResponse);
                return;
            }

            if (error.name === 'ValidationError') {
                const errorResponse: ErrorResponse = {
                    error: 'Validation failed: ' + error.message,
                    status: 400
                };
                res.status(400).json(errorResponse);
                return;
            }

            // Handle entity too large errors
            if (error.status === 413 || error.type === 'entity.too.large') {
                const errorResponse: ErrorResponse = {
                    error: 'Request entity too large',
                    status: 413
                };
                res.status(413).json(errorResponse);
                return;
            }

            // Handle timeout errors
            if (error.code === 'ETIMEDOUT' || error.timeout) {
                const errorResponse: ErrorResponse = {
                    error: 'Request timeout',
                    status: 408
                };
                res.status(408).json(errorResponse);
                return;
            }

            // Default error response
            const statusCode = error.status || error.statusCode || 500;
            const errorResponse: ErrorResponse = {
                error: process.env.NODE_ENV === 'production'
                    ? 'Internal server error'
                    : error.message || 'Unknown error',
                status: statusCode
            };

            res.status(statusCode).json(errorResponse);
        });
    }

    /**
     * Starts the server.
     * @returns Promise that resolves when the server is listening
     */
    start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    console.log(`MTG Game Engine server listening on port ${this.port}`);
                    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
                    console.log(`Process ID: ${process.pid}`);

                    // Start cleanup interval for expired sessions
                    setInterval(() => {
                        this.gameSessionManager.cleanupExpiredSessions();
                    }, 5 * 60 * 1000); // Clean up every 5 minutes

                    // Setup graceful shutdown handlers
                    this.setupGracefulShutdown();

                    resolve();
                });

                this.server.on('error', (error: Error) => {
                    console.error('Server error:', error);
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Sets up graceful shutdown handling.
     */
    private setupGracefulShutdown(): void {
        const shutdown = (signal: string) => {
            console.log(`Received ${signal}, shutting down gracefully...`);
            this.isShuttingDown = true;

            if (this.server) {
                this.server.close((err?: Error) => {
                    if (err) {
                        console.error('Error during server shutdown:', err);
                        process.exit(1);
                    } else {
                        console.log('Server closed successfully');
                        process.exit(0);
                    }
                });

                // Force close after 30 seconds
                setTimeout(() => {
                    console.error('Forcing server shutdown after timeout');
                    process.exit(1);
                }, 30000);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught exceptions and unhandled rejections
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            shutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            shutdown('unhandledRejection');
        });
    }

    /**
     * Stops the server gracefully.
     * @returns Promise that resolves when the server is stopped
     */
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }

            this.isShuttingDown = true;
            this.server.close((err?: Error) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Gets the Express app instance (useful for testing).
     * @returns The Express application instance
     */
    getApp(): express.Application {
        return this.app;
    }
}

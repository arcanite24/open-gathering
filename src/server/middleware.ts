import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ErrorResponse } from './types';

/**
 * Rate limiting middleware for API endpoints.
 */
export const createRateLimit = (
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    max: number = 100, // limit each IP to 100 requests per windowMs
    message: string = 'Too many requests from this IP, please try again later.',
    limiterName: string = 'general'
) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            status: 429,
            limiter: limiterName
        } as ErrorResponse,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res, next, options) => {
            const ip = req.ip || 'unknown';
            const userAgent = req.get('User-Agent') || 'Unknown';
            const path = req.path;
            const method = req.method;
            console.warn(`${new Date().toISOString()} - RATE LIMIT HIT - ${limiterName} - ${method} ${path} - IP: ${ip} - User-Agent: ${userAgent} - Limit: ${options.max} per ${options.windowMs / 60000} minutes`);
            res.status(429).json({
                error: message,
                status: 429,
                limiter: limiterName
            });
        }
    });
};

/**
 * General API rate limiter (100 requests per 15 minutes per IP).
 */
export const apiRateLimit = createRateLimit(undefined, undefined, undefined, 'api-general');

/**
 * Stricter rate limiter for game creation (10 games per hour per IP).
 */
export const gameCreationRateLimit = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10,
    'Too many games created from this IP, please try again later.',
    'game-creation'
);

/**
 * Action submission rate limiter (1000 actions per minute per IP).
 */
export const actionRateLimit = createRateLimit(
    60 * 1000, // 1 minute
    1000,
    'Too many actions submitted, please slow down.',
    'action-submission'
);

/**
 * Validation rules for creating a new game.
 */
export const validateCreateGame: ValidationChain[] = [
    body('player1Deck')
        .isArray({ min: 1, max: 100 })
        .withMessage('player1Deck must be an array with 1-100 cards'),
    body('player1Deck.*')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Card IDs must be non-empty strings with max 50 characters'),
    body('player2Deck')
        .isArray({ min: 1, max: 100 })
        .withMessage('player2Deck must be an array with 1-100 cards'),
    body('player2Deck.*')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Card IDs must be non-empty strings with max 50 characters')
];

/**
 * Validation rules for submitting an action.
 */
export const validateSubmitAction: ValidationChain[] = [
    body('playerId')
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('playerId must be a non-empty string with max 50 characters'),
    body('action')
        .isObject()
        .withMessage('action must be an object'),
    body('action.type')
        .isIn(['PLAY_LAND', 'PASS_PRIORITY', 'ADVANCE_TURN', 'ACTIVATE_ABILITY', 'CAST_SPELL'])
        .withMessage('action.type must be a valid action type'),
    body('action.cardId')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('action.cardId must be a non-empty string with max 50 characters'),
    body('action.abilityId')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('action.abilityId must be a non-empty string with max 50 characters'),
    body('action.targets')
        .optional()
        .isArray({ max: 10 })
        .withMessage('action.targets must be an array with max 10 targets')
];

/**
 * Middleware to handle validation errors.
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorResponse: ErrorResponse = {
            error: `Validation failed: ${errors.array().map(err => err.msg).join(', ')}`,
            status: 400
        };
        return res.status(400).json(errorResponse);
    }
    next();
};

/**
 * Request logging middleware.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Log the request
    console.log(`${new Date().toISOString()} - ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`);

    // Log the response when it finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        console.log(`${new Date().toISOString()} - ${method} ${url} - ${statusCode} - ${duration}ms`);
    });

    next();
};

/**
 * Security headers middleware.
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
};

/**
 * Game ID validation middleware.
 */
export const validateGameId = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.length > 100) {
        const errorResponse: ErrorResponse = {
            error: 'Invalid game ID format',
            status: 400
        };
        return res.status(400).json(errorResponse);
    }

    // Basic pattern validation for game IDs
    if (!/^game_\d+_[a-z0-9]{9}$/.test(id)) {
        const errorResponse: ErrorResponse = {
            error: 'Invalid game ID format',
            status: 400
        };
        return res.status(400).json(errorResponse);
    }

    next();
};

/**
 * Content-Type validation middleware for JSON endpoints.
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            const errorResponse: ErrorResponse = {
                error: 'Content-Type must be application/json',
                status: 400
            };
            return res.status(400).json(errorResponse);
        }
    }
    next();
};

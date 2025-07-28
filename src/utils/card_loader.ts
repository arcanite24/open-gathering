import * as fs from 'fs';
import * as path from 'path';
import { ICardDefinition } from '../core/game_state/interfaces';

/**
 * Validation error for card definitions
 */
export class CardValidationError extends Error {
    constructor(cardId: string, field: string, message: string) {
        super(`Card validation error for '${cardId}' in field '${field}': ${message}`);
        this.name = 'CardValidationError';
    }
}

/**
 * Validation schema for card definitions
 */
interface CardValidationSchema {
    required: (keyof ICardDefinition)[];
    optional: (keyof ICardDefinition)[];
    types: Record<keyof ICardDefinition, string>;
}

/**
 * Schema definition for card validation
 */
const CARD_SCHEMA: CardValidationSchema = {
    required: ['id', 'name'],
    optional: ['manaCost', 'cmc', 'types', 'subtypes', 'supertypes', 'colors', 'oracleText', 'power', 'toughness', 'loyalty', 'abilities', 'effects'],
    types: {
        id: 'string',
        name: 'string',
        manaCost: 'string',
        cmc: 'number',
        types: 'array',
        subtypes: 'array',
        supertypes: 'array',
        colors: 'array',
        oracleText: 'string',
        power: 'string',
        toughness: 'string',
        loyalty: 'string',
        abilities: 'array',
        effects: 'array'
    }
};

/**
 * Valid card types according to MTG rules
 */
const VALID_CARD_TYPES = [
    'Artifact', 'Creature', 'Enchantment', 'Instant', 'Land', 'Planeswalker', 'Sorcery', 'Tribal'
];

/**
 * Valid mana colors
 */
const VALID_COLORS = ['W', 'U', 'B', 'R', 'G'];

/**
 * Validates a single card definition
 */
function validateCardDefinition(card: any): ICardDefinition {
    if (!card || typeof card !== 'object') {
        throw new CardValidationError('unknown', 'root', 'Card definition must be an object');
    }

    const cardId = card.id || 'unknown';

    // Check required fields
    for (const field of CARD_SCHEMA.required) {
        if (!(field in card) || card[field] === null || card[field] === undefined) {
            throw new CardValidationError(cardId, field, `Required field is missing or null`);
        }
    }

    // Validate field types
    for (const [field, value] of Object.entries(card)) {
        if (value === null || value === undefined) continue;

        const expectedType = CARD_SCHEMA.types[field as keyof ICardDefinition];
        if (!expectedType) {
            throw new CardValidationError(cardId, field, `Unknown field`);
        }

        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== expectedType) {
            throw new CardValidationError(cardId, field, `Expected ${expectedType}, got ${actualType}`);
        }
    }

    // Validate specific constraints
    validateCardConstraints(card);

    return card as ICardDefinition;
}

/**
 * Validates specific card constraints beyond basic type checking
 */
function validateCardConstraints(card: any): void {
    const cardId = card.id;

    // Validate ID format
    if (typeof card.id !== 'string' || card.id.trim() === '') {
        throw new CardValidationError(cardId, 'id', 'ID must be a non-empty string');
    }

    // Validate name
    if (typeof card.name !== 'string' || card.name.trim() === '') {
        throw new CardValidationError(cardId, 'name', 'Name must be a non-empty string');
    }

    // Validate CMC if present
    if (card.cmc !== undefined && (typeof card.cmc !== 'number' || card.cmc < 0 || !Number.isInteger(card.cmc))) {
        throw new CardValidationError(cardId, 'cmc', 'CMC must be a non-negative integer');
    }

    // Validate mana cost format if present
    if (card.manaCost !== undefined) {
        validateManaCost(cardId, card.manaCost);
    }

    // Validate types
    if (card.types !== undefined) {
        if (!Array.isArray(card.types) || card.types.length === 0) {
            throw new CardValidationError(cardId, 'types', 'Types must be a non-empty array');
        }
        for (const type of card.types) {
            if (!VALID_CARD_TYPES.includes(type)) {
                throw new CardValidationError(cardId, 'types', `Invalid card type: ${type}`);
            }
        }
    }

    // Validate colors
    if (card.colors !== undefined) {
        if (!Array.isArray(card.colors)) {
            throw new CardValidationError(cardId, 'colors', 'Colors must be an array');
        }
        for (const color of card.colors) {
            if (!VALID_COLORS.includes(color)) {
                throw new CardValidationError(cardId, 'colors', `Invalid color: ${color}`);
            }
        }
    }

    // Validate creature stats
    if (card.types && card.types.includes('Creature')) {
        if (card.power !== undefined && (typeof card.power !== 'string' || card.power.trim() === '')) {
            throw new CardValidationError(cardId, 'power', 'Power must be a non-empty string for creatures');
        }
        if (card.toughness !== undefined && (typeof card.toughness !== 'string' || card.toughness.trim() === '')) {
            throw new CardValidationError(cardId, 'toughness', 'Toughness must be a non-empty string for creatures');
        }
    }

    // Validate planeswalker loyalty
    if (card.types && card.types.includes('Planeswalker')) {
        if (card.loyalty !== undefined && (typeof card.loyalty !== 'string' || card.loyalty.trim() === '')) {
            throw new CardValidationError(cardId, 'loyalty', 'Loyalty must be a non-empty string for planeswalkers');
        }
    }

    // Validate abilities
    if (card.abilities !== undefined) {
        validateAbilities(cardId, card.abilities);
    }

    // Validate effects
    if (card.effects !== undefined) {
        validateEffects(cardId, card.effects);
    }
}

/**
 * Validates mana cost format
 */
function validateManaCost(cardId: string, manaCost: string): void {
    if (typeof manaCost !== 'string') {
        throw new CardValidationError(cardId, 'manaCost', 'Mana cost must be a string');
    }

    // Allow empty string for lands and free spells
    if (manaCost === '') return;

    // Basic validation for mana cost format (should contain braces)
    const manaCostRegex = /^(\{[0-9WUBRGCX]+\})*$/;
    if (!manaCostRegex.test(manaCost)) {
        throw new CardValidationError(cardId, 'manaCost', `Invalid mana cost format: ${manaCost}`);
    }
}

/**
 * Validates abilities array
 */
function validateAbilities(cardId: string, abilities: any[]): void {
    if (!Array.isArray(abilities)) {
        throw new CardValidationError(cardId, 'abilities', 'Abilities must be an array');
    }

    for (let i = 0; i < abilities.length; i++) {
        const ability = abilities[i];
        if (!ability || typeof ability !== 'object') {
            throw new CardValidationError(cardId, `abilities[${i}]`, 'Ability must be an object');
        }

        if (!ability.key || typeof ability.key !== 'string') {
            throw new CardValidationError(cardId, `abilities[${i}].key`, 'Ability key must be a non-empty string');
        }

        if (!ability.parameters || typeof ability.parameters !== 'object') {
            throw new CardValidationError(cardId, `abilities[${i}].parameters`, 'Ability parameters must be an object');
        }
    }
}

/**
 * Validates effects array
 */
function validateEffects(cardId: string, effects: any[]): void {
    if (!Array.isArray(effects)) {
        throw new CardValidationError(cardId, 'effects', 'Effects must be an array');
    }

    for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        if (!effect || typeof effect !== 'object') {
            throw new CardValidationError(cardId, `effects[${i}]`, 'Effect must be an object');
        }

        if (!effect.key || typeof effect.key !== 'string') {
            throw new CardValidationError(cardId, `effects[${i}].key`, 'Effect key must be a non-empty string');
        }

        if (!effect.parameters || typeof effect.parameters !== 'object') {
            throw new CardValidationError(cardId, `effects[${i}].parameters`, 'Effect parameters must be an object');
        }
    }
}

/**
 * Loads and validates card definitions from JSON files in a directory
 */
export function loadCardDefinitions(dataDirectory: string): Map<string, ICardDefinition> {
    const cardDefinitions = new Map<string, ICardDefinition>();
    const setsDirectory = path.join(dataDirectory, 'sets');

    if (!fs.existsSync(setsDirectory)) {
        throw new Error(`Sets directory not found: ${setsDirectory}`);
    }

    const jsonFiles = fs.readdirSync(setsDirectory).filter(file => file.endsWith('.json'));

    if (jsonFiles.length === 0) {
        throw new Error(`No JSON files found in sets directory: ${setsDirectory}`);
    }

    for (const file of jsonFiles) {
        const filePath = path.join(setsDirectory, file);
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const cards = JSON.parse(fileContent);

            if (!Array.isArray(cards)) {
                throw new Error(`File ${file} must contain an array of card definitions`);
            }

            for (const cardData of cards) {
                try {
                    const validatedCard = validateCardDefinition(cardData);

                    // Check for duplicate IDs
                    if (cardDefinitions.has(validatedCard.id)) {
                        throw new Error(`Duplicate card ID found: ${validatedCard.id}`);
                    }

                    cardDefinitions.set(validatedCard.id, validatedCard);
                } catch (error) {
                    if (error instanceof CardValidationError) {
                        throw new Error(`Validation error in file ${file}: ${error.message}`);
                    }
                    throw error;
                }
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in file ${file}: ${error.message}`);
            }
            throw error;
        }
    }

    if (cardDefinitions.size === 0) {
        throw new Error('No valid card definitions found');
    }

    return cardDefinitions;
}

/**
 * Loads card definitions from specific JSON files
 */
export function loadCardDefinitionsFromFiles(filePaths: string[]): Map<string, ICardDefinition> {
    const cardDefinitions = new Map<string, ICardDefinition>();

    for (const filePath of filePaths) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Card definition file not found: ${filePath}`);
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const cards = JSON.parse(fileContent);

            if (!Array.isArray(cards)) {
                throw new Error(`File ${filePath} must contain an array of card definitions`);
            }

            for (const cardData of cards) {
                try {
                    const validatedCard = validateCardDefinition(cardData);

                    // Check for duplicate IDs
                    if (cardDefinitions.has(validatedCard.id)) {
                        throw new Error(`Duplicate card ID found: ${validatedCard.id}`);
                    }

                    cardDefinitions.set(validatedCard.id, validatedCard);
                } catch (error) {
                    if (error instanceof CardValidationError) {
                        throw new Error(`Validation error in file ${filePath}: ${error.message}`);
                    }
                    throw error;
                }
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in file ${filePath}: ${error.message}`);
            }
            throw error;
        }
    }

    return cardDefinitions;
}

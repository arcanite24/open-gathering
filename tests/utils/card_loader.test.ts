import * as fs from 'fs';
import * as path from 'path';
import { loadCardDefinitions, loadCardDefinitionsFromFiles, CardValidationError } from '../../src/utils/card_loader';
import { ICardDefinition } from '../../src/core/game_state/interfaces';

describe('Card Loader', () => {
    const testDataDir = path.join(__dirname, '..', '..', 'data');

    describe('loadCardDefinitions', () => {
        it('should load card definitions from data directory', () => {
            const cardDefinitions = loadCardDefinitions(testDataDir);

            expect(cardDefinitions.size).toBeGreaterThan(0);
            expect(cardDefinitions.has('basic_plains')).toBe(true);
            expect(cardDefinitions.has('basic_island')).toBe(true);
            expect(cardDefinitions.has('grizzly_bears')).toBe(true);
        });

        it('should validate card definitions properly', () => {
            const cardDefinitions = loadCardDefinitions(testDataDir);
            const plains = cardDefinitions.get('basic_plains');

            expect(plains).toBeDefined();
            expect(plains!.id).toBe('basic_plains');
            expect(plains!.name).toBe('Plains');
            expect(plains!.types).toEqual(['Land']);
            expect(plains!.subtypes).toEqual(['Plains']);
            expect(plains!.abilities).toBeDefined();
            expect(plains!.abilities!.length).toBe(1);
            expect(plains!.abilities![0].key).toBe('inherent_ability_tap_add_mana');
        });

        it('should throw error for non-existent directory', () => {
            expect(() => {
                loadCardDefinitions('/non/existent/path');
            }).toThrow('Sets directory not found');
        });

        it('should validate creature cards with power and toughness', () => {
            const cardDefinitions = loadCardDefinitions(testDataDir);
            const grizzlyBears = cardDefinitions.get('grizzly_bears');

            expect(grizzlyBears).toBeDefined();
            expect(grizzlyBears!.types).toEqual(['Creature']);
            expect(grizzlyBears!.subtypes).toEqual(['Bear']);
            expect(grizzlyBears!.power).toBe('2');
            expect(grizzlyBears!.toughness).toBe('2');
            expect(grizzlyBears!.manaCost).toBe('{1}{G}');
            expect(grizzlyBears!.cmc).toBe(2);
        });
    });

    describe('Card Validation', () => {
        const tempDir = path.join(__dirname, 'temp_card_test');

        beforeEach(() => {
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
        });

        afterEach(() => {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });

        it('should reject cards without required fields', () => {
            const invalidCard = [{ name: 'Test Card' }]; // Missing id
            const testFile = path.join(tempDir, 'invalid.json');
            fs.writeFileSync(testFile, JSON.stringify(invalidCard));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/Required field is missing/);
        });

        it('should reject cards with invalid types', () => {
            const invalidCard = [{
                id: 'test_card',
                name: 'Test Card',
                types: ['InvalidType']
            }];
            const testFile = path.join(tempDir, 'invalid_type.json');
            fs.writeFileSync(testFile, JSON.stringify(invalidCard));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/Invalid card type/);
        });

        it('should reject cards with invalid mana cost format', () => {
            const invalidCard = [{
                id: 'test_card',
                name: 'Test Card',
                manaCost: 'invalid_mana_cost',
                types: ['Instant']
            }];
            const testFile = path.join(tempDir, 'invalid_mana.json');
            fs.writeFileSync(testFile, JSON.stringify(invalidCard));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/Invalid mana cost format/);
        });

        it('should reject cards with invalid colors', () => {
            const invalidCard = [{
                id: 'test_card',
                name: 'Test Card',
                types: ['Instant'],
                colors: ['Z'] // Invalid color
            }];
            const testFile = path.join(tempDir, 'invalid_color.json');
            fs.writeFileSync(testFile, JSON.stringify(invalidCard));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/Invalid color/);
        });

        it('should reject cards with malformed abilities', () => {
            const invalidCard = [{
                id: 'test_card',
                name: 'Test Card',
                types: ['Creature'],
                abilities: [{ /* missing key and parameters */ }]
            }];
            const testFile = path.join(tempDir, 'invalid_ability.json');
            fs.writeFileSync(testFile, JSON.stringify(invalidCard));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/Ability key must be a non-empty string/);
        });

        it('should accept valid cards with all optional fields', () => {
            const validCard = [{
                id: 'valid_test_card',
                name: 'Valid Test Card',
                manaCost: '{2}{W}{U}',
                cmc: 4,
                types: ['Creature'],
                subtypes: ['Human', 'Wizard'],
                supertypes: ['Legendary'],
                colors: ['W', 'U'],
                oracleText: 'Flying, vigilance',
                power: '3',
                toughness: '4',
                abilities: [{
                    key: 'test_ability',
                    parameters: { value: 1 }
                }]
            }];
            const testFile = path.join(tempDir, 'valid.json');
            fs.writeFileSync(testFile, JSON.stringify(validCard));

            const cardDefinitions = loadCardDefinitionsFromFiles([testFile]);
            expect(cardDefinitions.size).toBe(1);

            const card = cardDefinitions.get('valid_test_card');
            expect(card).toBeDefined();
            expect(card!.supertypes).toEqual(['Legendary']);
            expect(card!.colors).toEqual(['W', 'U']);
        });

        it('should reject duplicate card IDs', () => {
            const duplicateCards = [
                { id: 'duplicate_id', name: 'Card 1', types: ['Instant'] },
                { id: 'duplicate_id', name: 'Card 2', types: ['Sorcery'] }
            ];
            const testFile = path.join(tempDir, 'duplicates.json');
            fs.writeFileSync(testFile, JSON.stringify(duplicateCards));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/Duplicate card ID found/);
        });

        it('should validate CMC as non-negative integer', () => {
            const invalidCard = [{
                id: 'test_card',
                name: 'Test Card',
                cmc: -1,
                types: ['Instant']
            }];
            const testFile = path.join(tempDir, 'invalid_cmc.json');
            fs.writeFileSync(testFile, JSON.stringify(invalidCard));

            expect(() => {
                loadCardDefinitionsFromFiles([testFile]);
            }).toThrow(/CMC must be a non-negative integer/);
        });
    });
});

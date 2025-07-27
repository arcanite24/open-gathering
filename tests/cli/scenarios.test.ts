import { allScenarios, getScenario, basicLandScenario, creatureCombatScenario } from '../../src/cli/scenarios/scenarios';

describe('Scenarios', () => {
    describe('allScenarios', () => {
        it('should contain predefined scenarios', () => {
            expect(allScenarios).toHaveLength(2);
            expect(allScenarios).toContain(basicLandScenario);
            expect(allScenarios).toContain(creatureCombatScenario);
        });
    });

    describe('getScenario', () => {
        it('should find scenario by exact name', () => {
            const scenario = getScenario('Basic Lands');
            expect(scenario).toBe(basicLandScenario);
        });

        it('should find scenario by case-insensitive name', () => {
            const scenario = getScenario('basic lands');
            expect(scenario).toBe(basicLandScenario);
        });

        it('should find scenario by hyphenated name', () => {
            const scenario = getScenario('basic-lands');
            expect(scenario).toBe(basicLandScenario);
        });

        it('should return undefined for non-existent scenario', () => {
            const scenario = getScenario('Non Existent');
            expect(scenario).toBeUndefined();
        });
    });

    describe('basicLandScenario', () => {
        it('should have correct structure', () => {
            expect(basicLandScenario.name).toBe('Basic Lands');
            expect(basicLandScenario.description).toBeDefined();
            expect(basicLandScenario.player1Deck).toHaveLength(8);
            expect(basicLandScenario.player2Deck).toHaveLength(8);
        });

        it('should have valid card definitions', () => {
            const card = basicLandScenario.player1Deck[0];
            expect(card.id).toBeDefined();
            expect(card.name).toBeDefined();
            expect(card.types).toContain('Land');
        });
    });

    describe('creatureCombatScenario', () => {
        it('should have correct structure', () => {
            expect(creatureCombatScenario.name).toBe('Creature Combat');
            expect(creatureCombatScenario.description).toBeDefined();
            expect(creatureCombatScenario.player1Deck).toHaveLength(8);
            expect(creatureCombatScenario.player2Deck).toHaveLength(8);
        });

        it('should contain both lands and creatures', () => {
            const hasLands = creatureCombatScenario.player1Deck.some(card =>
                card.types?.includes('Land')
            );
            const hasCreatures = creatureCombatScenario.player1Deck.some(card =>
                card.types?.includes('Creature')
            );

            expect(hasLands).toBe(true);
            expect(hasCreatures).toBe(true);
        });

        it('should have creatures with power and toughness', () => {
            const creature = creatureCombatScenario.player1Deck.find(card =>
                card.types?.includes('Creature')
            );

            expect(creature).toBeDefined();
            expect(creature?.power).toBeDefined();
            expect(creature?.toughness).toBeDefined();
        });
    });
});

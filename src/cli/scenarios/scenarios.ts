import { ICardDefinition } from '../../core/game_state/interfaces';

export interface Scenario {
    name: string;
    description: string;
    player1Deck: ICardDefinition[];
    player2Deck: ICardDefinition[];
    initialActions?: string[];
}

/**
 * Basic land scenario - both players have basic lands
 */
export const basicLandScenario: Scenario = {
    name: 'Basic Lands',
    description: 'Both players have basic lands for mana testing',
    player1Deck: [
        {
            id: 'basic_plains',
            name: 'Plains',
            types: ['Land', 'Plains'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{W}' }
                }
            ]
        },
        {
            id: 'basic_forest',
            name: 'Forest',
            types: ['Land', 'Forest'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{G}' }
                }
            ]
        }
    ].concat(Array(6).fill({
        id: 'basic_plains',
        name: 'Plains',
        types: ['Land', 'Plains'],
        abilities: [
            {
                key: 'inherent_ability_tap_add_mana',
                parameters: { mana: '{W}' }
            }
        ]
    })),
    player2Deck: [
        {
            id: 'basic_island',
            name: 'Island',
            types: ['Land', 'Island'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{U}' }
                }
            ]
        },
        {
            id: 'basic_mountain',
            name: 'Mountain',
            types: ['Land', 'Mountain'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{R}' }
                }
            ]
        }
    ].concat(Array(6).fill({
        id: 'basic_island',
        name: 'Island',
        types: ['Land', 'Island'],
        abilities: [
            {
                key: 'inherent_ability_tap_add_mana',
                parameters: { mana: '{U}' }
            }
        ]
    }))
};

/**
 * Creature combat scenario - basic creatures for combat testing
 */
export const creatureCombatScenario: Scenario = {
    name: 'Creature Combat',
    description: 'Mix of lands and creatures for combat testing',
    player1Deck: [
        {
            id: 'basic_forest',
            name: 'Forest',
            types: ['Land', 'Forest'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{G}' }
                }
            ]
        },
        {
            id: 'basic_forest',
            name: 'Forest',
            types: ['Land', 'Forest'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{G}' }
                }
            ]
        },
        {
            id: 'grizzly_bears',
            name: 'Grizzly Bears',
            manaCost: '{1}{G}',
            cmc: 2,
            types: ['Creature'],
            subtypes: ['Bear'],
            power: '2',
            toughness: '2'
        },
        {
            id: 'grizzly_bears',
            name: 'Grizzly Bears',
            manaCost: '{1}{G}',
            cmc: 2,
            types: ['Creature'],
            subtypes: ['Bear'],
            power: '2',
            toughness: '2'
        }
    ].concat(Array(4).fill({
        id: 'basic_forest',
        name: 'Forest',
        types: ['Land', 'Forest'],
        abilities: [
            {
                key: 'inherent_ability_tap_add_mana',
                parameters: { mana: '{G}' }
            }
        ]
    })),
    player2Deck: [
        {
            id: 'basic_island',
            name: 'Island',
            types: ['Land', 'Island'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{U}' }
                }
            ]
        },
        {
            id: 'basic_island',
            name: 'Island',
            types: ['Land', 'Island'],
            abilities: [
                {
                    key: 'inherent_ability_tap_add_mana',
                    parameters: { mana: '{U}' }
                }
            ]
        },
        {
            id: 'merfolk_of_the_pearl_trident',
            name: 'Merfolk of the Pearl Trident',
            manaCost: '{U}',
            cmc: 1,
            types: ['Creature'],
            subtypes: ['Merfolk'],
            power: '1',
            toughness: '1'
        },
        {
            id: 'merfolk_of_the_pearl_trident',
            name: 'Merfolk of the Pearl Trident',
            manaCost: '{U}',
            cmc: 1,
            types: ['Creature'],
            subtypes: ['Merfolk'],
            power: '1',
            toughness: '1'
        }
    ].concat(Array(4).fill({
        id: 'basic_island',
        name: 'Island',
        types: ['Land', 'Island'],
        abilities: [
            {
                key: 'inherent_ability_tap_add_mana',
                parameters: { mana: '{U}' }
            }
        ]
    }))
};

export const allScenarios: Scenario[] = [
    basicLandScenario,
    creatureCombatScenario
];

export function getScenario(name: string): Scenario | undefined {
    return allScenarios.find(scenario =>
        scenario.name.toLowerCase() === name.toLowerCase() ||
        scenario.name.replace(/\s+/g, '-').toLowerCase() === name.toLowerCase()
    );
}

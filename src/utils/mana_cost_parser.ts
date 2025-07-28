// src/utils/mana_cost_parser.ts

import { ManaPool } from '../core/game_state/interfaces';

/**
 * Parses a mana cost string (e.g., "{2}{W}{U}") into a ManaPool object.
 * @param cost The mana cost string to parse
 * @returns A ManaPool object representing the cost
 */
export function parseManaCost(cost: string): ManaPool {
  const manaPool: ManaPool = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, generic: 0 };
  const regex = /\{(\w+)\}/g;
  let match;

  while ((match = regex.exec(cost)) !== null) {
    const symbol = match[1];
    if (/\d/.test(symbol)) {
      manaPool.generic += parseInt(symbol, 10);
    } else {
      switch (symbol.toUpperCase()) {
        case 'W':
          manaPool.W++;
          break;
        case 'U':
          manaPool.U++;
          break;
        case 'B':
          manaPool.B++;
          break;
        case 'R':
          manaPool.R++;
          break;
        case 'G':
          manaPool.G++;
          break;
        case 'C':
          manaPool.C++;
          break;
      }
    }
  }

  return manaPool;
}

# Card Schema

This document defines the JSON schema for card definitions in the MTG engine.

## Overview

Card definitions are stored as JSON objects that contain all the static information about a card, including its name, cost, types, and abilities.

## Schema Structure

```json
{
  "id": "string (unique identifier for the card definition)",
  "name": "string (card name)",
  "manaCost": "string (mana cost in standard MTG notation, e.g., '{1}{W}{W}')",
  "cmc": "number (converted mana cost)",
  "types": "string[] (card types, e.g., ['Creature', 'Instant'])",
  "subtypes": "string[] (card subtypes, e.g., ['Human', 'Soldier'])",
  "supertypes": "string[] (card supertypes, e.g., ['Legendary'])",
  "oracleText": "string (Oracle text of the card)",
  "power": "string (power value for creatures, null/absent for non-creatures)",
  "toughness": "string (toughness value for creatures, null/absent for non-creatures)",
  "loyalty": "string (loyalty value for planeswalkers, null/absent for non-planeswalkers)",
  "abilities": "array of objects (abilities the card has, each with a key and parameters)",
  "effects": "array of objects (effects for instants/sorceries)"
}
```

## Abilities Structure

Each ability in the `abilities` array follows this structure:

```json
{
  "key": "string (identifier for the ability implementation)",
  "parameters": "object (parameters specific to this ability instance)"
}
```

## Effects Structure

Each effect in the `effects` array follows this structure:

```json
{
  "key": "string (identifier for the effect implementation)",
  "parameters": "object (parameters specific to this effect instance)"
}
```

## Example

```json
{
  "id": "basic_plains",
  "name": "Plains",
  "types": ["Land", "Plains"],
  "abilities": [
    {
      "key": "inherent_ability_tap_add_mana",
      "parameters": { "mana": "{W}" }
    }
  ]
}
```
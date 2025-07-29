# Deck Definition Schema

This document describes the JSON schema for deck definitions in Open Gathering.

## Overview

Deck definitions are JSON files that describe a complete deck that can be used in the game. These files are stored in the `data/decks` directory.

## Schema

```json
{
  "id": "string",
  "name": "string",
  "description": "string (optional)",
  "format": "string (optional)",
  "author": "string (optional)",
  "cardIds": ["string"]
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the deck |
| `name` | string | Yes | Human-readable name for the deck |
| `description` | string | No | Description of the deck's strategy or theme |
| `format` | string | No | Format the deck is designed for (e.g., 'standard', 'modern', 'commander') |
| `author` | string | No | Creator of the deck |
| `cardIds` | array of strings | Yes | Array of card definition IDs that make up the deck |

## Example

```json
{
  "id": "sample_deck_1",
  "name": "Sample Deck 1",
  "description": "A sample deck for testing purposes",
  "format": "standard",
  "author": "Open Gathering Team",
  "cardIds": [
    "basic_forest",
    "basic_forest",
    "basic_forest",
    "basic_forest",
    "basic_forest",
    "basic_forest",
    "basic_forest",
    "basic_forest",
    "grizzly_bears",
    "grizzly_bears",
    "grizzly_bears",
    "grizzly_bears",
    "lightning_bolt",
    "lightning_bolt",
    "lightning_bolt",
    "lightning_bolt"
  ]
}
```

## Usage

Deck definitions can be used in the CLI with the `new-game` command:

```bash
# Start a new game with predefined decks
./cli new-game sample_deck_1 sample_deck_2
```

The CLI will first look for a deck definition file in `data/decks/{deck_name}.json`. If found, it will use that deck. If not found, it will fall back to the original behavior of loading card sets from `data/sets/{deck_name}.json`.

# HTTP Server API Documentation

This document describes the REST API endpoints provided by the MTG Game Engine HTTP server.

## Base URL

When running locally: `http://localhost:3000`

## Endpoints

### Health Check

**GET** `/health`

Returns the server health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-27T04:49:09.921Z",
  "activeSessions": 0
}
```

### Get Available Cards

**GET** `/cards`

Returns a list of all available card definitions that can be used in decks.

**Response:**
```json
{
  "cards": [
    {
      "id": "basic_plains",
      "name": "Plains",
      "manaCost": "",
      "cmc": 0,
      "types": ["Land"],
      "subtypes": ["Plains"],
      "supertypes": [],
      "oracleText": "({T}: Add {W}.)",
      "abilities": [
        {
          "key": "inherent_ability_tap_add_mana",
          "parameters": { "mana": "{W}" }
        }
      ]
    }
    // ... more cards
  ]
}
```

### Create Game

**POST** `/games`

Creates a new game session with the specified decks for both players.

**Request Body:**
```json
{
  "player1Deck": ["basic_plains", "basic_forest", "basic_island"],
  "player2Deck": ["basic_swamp", "basic_mountain", "basic_plains"]
}
```

**Response:**
```json
{
  "gameId": "game_1753591749983_hqle7qhz7",
  "gameState": {
    // Complete game state object
    "players": {...},
    "zones": {...},
    "cardInstances": {...},
    "activePlayerId": "player1",
    "priorityPlayerId": "player1",
    // ... more properties
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body or deck format
- `500 Internal Server Error`: Invalid card IDs in deck

### Get Game State

**GET** `/games/:id`

Retrieves the current state of a game session.

**Parameters:**
- `id`: The game ID returned from the create game endpoint

**Response:**
```json
{
  "gameState": {
    // Complete game state object
  }
}
```

**Error Responses:**
- `404 Not Found`: Game session not found

### Submit Action

**POST** `/games/:id/actions`

Submits an action to a game session.

**Parameters:**
- `id`: The game ID

**Request Body:**
```json
{
  "playerId": "player1",
  "action": {
    "type": "PASS_PRIORITY"
  }
}
```

**Available Action Types:**

1. **Pass Priority**
   ```json
   { "type": "PASS_PRIORITY" }
   ```

2. **Play Land**
   ```json
   {
     "type": "PLAY_LAND",
     "cardId": "p1_card_0"
   }
   ```

3. **Activate Ability**
   ```json
   {
     "type": "ACTIVATE_ABILITY",
     "cardId": "p1_card_0",
     "abilityId": "ability_id",
     "targets": [
       // optional target array
     ]
   }
   ```

4. **Advance Turn**
   ```json
   { "type": "ADVANCE_TURN" }
   ```

5. **Cast Spell** (placeholder)
   ```json
   {
     "type": "CAST_SPELL",
     "cardId": "p1_card_0",
     "targets": [
       // optional target array
     ]
   }
   ```

**Response:**
```json
{
  "success": true,
  "gameState": {
    // Updated game state after action
  }
}
```

**Error Response (invalid action):**
```json
{
  "success": false,
  "gameState": {
    // Previous game state (unchanged)
  },
  "error": "Action failed: invalid timing"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid action
- `404 Not Found`: Game session not found

## Error Handling

All endpoints may return the following error format:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Example Usage

### Complete Game Flow

1. **Create a game:**
   ```bash
   curl -X POST http://localhost:3000/games \
     -H "Content-Type: application/json" \
     -d '{
       "player1Deck": ["basic_plains", "basic_forest"],
       "player2Deck": ["basic_island", "basic_mountain"]
     }'
   ```

2. **Get game state:**
   ```bash
   curl -X GET http://localhost:3000/games/game_123456789_abc123def
   ```

3. **Submit an action:**
   ```bash
   curl -X POST http://localhost:3000/games/game_123456789_abc123def/actions \
     -H "Content-Type: application/json" \
     -d '{
       "playerId": "player1",
       "action": { "type": "PASS_PRIORITY" }
     }'
   ```

## Development

To start the server in development mode:
```bash
npm run server:dev
```

To run tests:
```bash
npm test -- --testPathPatterns=server
```

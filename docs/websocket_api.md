# WebSocket Real-Time Game Updates

This document describes how to use the WebSocket functionality for real-time game updates in the MTG Game Engine server.

## Overview

The WebSocket implementation provides real-time communication between clients and the server, allowing players to receive instant updates about game state changes and action results.

## Connection

Connect to the WebSocket server at:
```
ws://localhost:3000/ws
```

## Message Types

### Client to Server Messages

#### AUTHENTICATE
Authenticate with a specific game and player ID:

```json
{
  "type": "AUTHENTICATE",
  "payload": {
    "gameId": "game_123456",
    "playerId": "player1",
    "token": "optional_auth_token"
  }
}
```

#### PING
Send a ping to keep the connection alive:

```json
{
  "type": "PING",
  "timestamp": 1753593000000
}
```

#### PONG
Respond to a server ping:

```json
{
  "type": "PONG",
  "timestamp": 1753593000000
}
```

### Server to Client Messages

#### AUTHENTICATE
Authentication response:

```json
{
  "type": "AUTHENTICATE",
  "payload": {
    "success": true
  },
  "gameId": "game_123456"
}
```

#### GAME_STATE_UPDATE
Broadcasted when game state changes:

```json
{
  "type": "GAME_STATE_UPDATE",
  "payload": {
    "gameState": {
      "turn": 1,
      "phase": "main1",
      "activePlayerId": "player1",
      "priorityPlayerId": "player1",
      // ... full game state
    },
    "action": {
      "type": "PLAY_LAND",
      "cardId": "basic_forest"
    },
    "playerId": "player1"
  },
  "gameId": "game_123456",
  "timestamp": 1753593000000
}
```

#### ACTION_RESULT
Broadcasted when an action is submitted:

```json
{
  "type": "ACTION_RESULT",
  "payload": {
    "success": true,
    "gameState": {
      // ... updated game state
    },
    "action": {
      "type": "PLAY_LAND",
      "cardId": "basic_forest"
    },
    "playerId": "player1"
  },
  "gameId": "game_123456",
  "timestamp": 1753593000000
}
```

#### ERROR
Error message:

```json
{
  "type": "ERROR",
  "payload": {
    "message": "Invalid message format",
    "code": "INVALID_FORMAT"
  },
  "timestamp": 1753593000000
}
```

#### PING
Server ping (client should respond with PONG):

```json
{
  "type": "PING",
  "timestamp": 1753593000000
}
```

## Usage Example

### JavaScript Client Example

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
  
  // Authenticate with a game
  ws.send(JSON.stringify({
    type: 'AUTHENTICATE',
    payload: {
      gameId: 'my-game-id',
      playerId: 'player1'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'AUTHENTICATE':
      if (message.payload.success) {
        console.log('Successfully authenticated');
      }
      break;
      
    case 'GAME_STATE_UPDATE':
      console.log('Game state updated:', message.payload.gameState);
      // Update your UI with the new game state
      updateGameUI(message.payload.gameState);
      break;
      
    case 'ACTION_RESULT':
      console.log('Action result:', message.payload);
      if (message.payload.success) {
        console.log('Action succeeded');
      } else {
        console.log('Action failed:', message.payload.error);
      }
      break;
      
    case 'PING':
      // Respond to server ping
      ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: Date.now()
      }));
      break;
      
    case 'ERROR':
      console.error('WebSocket error:', message.payload.message);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket connection closed');
};

function updateGameUI(gameState) {
  // Update your game UI based on the new state
  document.getElementById('current-turn').textContent = gameState.turn;
  document.getElementById('current-phase').textContent = gameState.phase;
  document.getElementById('active-player').textContent = gameState.activePlayerId;
  // ... update other UI elements
}
```

### Node.js Client Example

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'AUTHENTICATE',
    payload: {
      gameId: 'my-game-id',
      playerId: 'player1'
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  switch (message.type) {
    case 'GAME_STATE_UPDATE':
      console.log(`Game state updated by ${message.payload.playerId}`);
      console.log(`Current turn: ${message.payload.gameState.turn}`);
      console.log(`Current phase: ${message.payload.gameState.phase}`);
      break;
      
    case 'ACTION_RESULT':
      console.log(`Action ${message.payload.action.type} by ${message.payload.playerId}: ${message.payload.success ? 'SUCCESS' : 'FAILED'}`);
      break;
      
    case 'PING':
      ws.send(JSON.stringify({
        type: 'PONG',
        timestamp: Date.now()
      }));
      break;
  }
});
```

## Integration with HTTP API

The WebSocket system is fully integrated with the HTTP API. When you submit actions via the HTTP API (`POST /games/:id/actions`), the results are automatically broadcasted to all connected WebSocket clients for that game.

### Workflow:
1. Connect to WebSocket and authenticate with game ID
2. Use HTTP API to submit actions
3. Receive real-time updates via WebSocket
4. Update your UI in real-time

## Statistics

Get WebSocket connection statistics:

```bash
curl http://localhost:3000/ws/stats
```

Response:
```json
{
  "totalClients": 5,
  "authenticatedClients": 3,
  "gamesWithClients": 2
}
```

## Error Handling

The WebSocket implementation includes comprehensive error handling:

- Invalid JSON messages result in ERROR responses
- Connection timeouts are handled gracefully
- Failed authentication attempts are logged
- Network errors trigger automatic cleanup

## Security Considerations

- Authentication is currently basic (game ID + player ID)
- In production, implement proper token-based authentication
- Rate limiting is handled at the HTTP level
- WebSocket connections are cleaned up automatically

## Testing

The WebSocket functionality includes comprehensive tests covering:
- Connection handling
- Message parsing and routing
- Authentication flow
- Broadcasting to multiple clients
- Error scenarios
- Integration with the HTTP server

Run tests with:
```bash
npm test tests/server/websocket.test.ts
```

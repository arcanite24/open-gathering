#!/usr/bin/env node

import { Command } from 'commander';
import { CLI } from './cli';

const program = new Command();

program
    .name('mtg-cli')
    .description('CLI tool for testing the Magic: The Gathering engine')
    .version('1.0.0');

program
    .command('start')
    .description('Start an interactive CLI session')
    .action(async () => {
        const cli = new CLI();
        await cli.start();
    });

program
    .command('new-game')
    .description('Start a new game with predefined decks')
    .option('-1, --player1-deck <deck>', 'Player 1 deck file', 'basic')
    .option('-2, --player2-deck <deck>', 'Player 2 deck file', 'basic')
    .action(async (options) => {
        const cli = new CLI();
        await cli.newGame(options.player1Deck, options.player2Deck);
        await cli.start();
    });

program
    .command('load')
    .description('Load a saved game state')
    .argument('<filename>', 'Game state file to load')
    .action(async (filename) => {
        const cli = new CLI();
        await cli.loadGame(filename);
        await cli.start();
    });

program.parse();

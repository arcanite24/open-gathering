# Complex Cards Data Set

This document describes the complex cards data set created for the MTG engine.

## Overview

The `data/sets/complex_cards.json` file contains card definitions that demonstrate various types of abilities implemented in the engine:

- **Static Abilities**: Continuous effects that modify the game state
- **Triggered Abilities**: Abilities that trigger when specific events occur
- **Activated Abilities**: Abilities that can be activated by paying costs

## Cards Included

### Creatures with Static Abilities
- **Benalish Marshal** ({W}{W}{W}): 3/3 Human Knight - "Other creatures you control get +1/+1"
- **Goblin Lord** ({1}{R}{R}): 2/2 Goblin - "Other Goblin creatures get +1/+1 and have mountainwalk"

### Creatures with Triggered Abilities
- **Graveyard Specter** ({1}{B}{B}): 1/1 Specter - "When Graveyard Specter dies, you gain 1 life"
- **Soul Warden** ({W}): 1/1 Human Cleric - "Whenever another creature enters the battlefield, you gain 1 life"

### Creatures with Activated Abilities
- **Llanowar Elves** ({G}): 1/1 Elf Druid - "{T}: Add {G}"
- **Fyndhorn Elves** ({G}): 1/1 Elf Druid - "{T}: Add {G}"

### Vanilla Creatures (No Abilities)
- **Serra Angel** ({3}{W}{W}): 4/4 Angel - Flying, vigilance (keywords not yet implemented)
- **Elvish Warriors** ({G}{G}): 2/3 Elf Warrior
- **Monastery Swiftspear** ({R}): 1/2 Human Monk - Haste, prowess (keywords not yet implemented)
- **Vampire Nighthawk** ({1}{B}{B}): 2/3 Vampire Shaman - Flying, deathtouch, lifelink (keywords not yet implemented)
- **Wall of Omens** ({1}{W}): 0/4 Wall - Defender, enters-the-battlefield trigger (not yet implemented)

### Enchantments with Static Abilities
- **Crusade** ({W}{W}): "White creatures get +1/+1"
- **Bad Moon** ({1}{B}): "Black creatures get +1/+1"

### Instants with Effects
- **Lightning Bolt** ({R}): "Lightning Bolt deals 3 damage to any target"
- **Counterspell** ({U}{U}): "Counter target spell"

## Ability Keys Used

The following ability implementation keys are referenced in the complex cards:

- `inherent_ability_tap_add_mana`: For mana-producing activated abilities
- `when_this_creature_dies_gain_life`: For death-triggered abilities
- `creatures_get_plus_one_plus_one`: For static abilities that boost creatures

## Future Considerations

Some cards include Oracle text for abilities not yet implemented:
- Keywords like flying, vigilance, haste, deathtouch, lifelink
- More complex triggered abilities (enters-the-battlefield effects)
- Targeted instant/sorcery effects

These can be implemented as the engine expands its capability set.

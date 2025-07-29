/**
 * Interface for deck definitions stored in JSON files
 */
export interface IDeckDefinition {
    /**
     * Unique identifier for the deck
     */
    id: string;

    /**
     * Human-readable name for the deck
     */
    name: string;

    /**
     * Description of the deck's strategy or theme
     */
    description?: string;

    /**
     * Array of card definition IDs that make up the deck
     */
    cardIds: string[];

    /**
     * Format the deck is designed for (e.g., 'standard', 'modern', 'commander')
     */
    format?: string;

    /**
     * Creator of the deck
     */
    author?: string;
}

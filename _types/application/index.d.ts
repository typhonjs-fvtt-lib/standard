/**
 * Provides game wide menu functionality.
 */
declare class TJSContextMenu {
    /**
     * Stores any active context menu.
     */
    static "__#119446@#contextMenu": any;
    /**
     * Creates and manages a game wide context menu.
     *
     * @param {object}   opts - Optional parameters.
     *
     * @param {string}   [opts.id] - A custom CSS ID to add to the menu.
     *
     * @param {number}   opts.x - X position for the top / left of the menu.
     *
     * @param {number}   opts.y - Y position for the top / left of the menu.
     *
     * @param {object[]} opts.items - Menu items to display.
     *
     * @param {number}   [opts.zIndex=10000] - Z-index for context menu.
     *
     * @param {...*}     [opts.transitionOptions] - The rest of opts defined the slideFade transition options.
     */
    static create({ id, x, y, items, zIndex, ...transitionOptions }?: {
        id?: string;
        x: number;
        y: number;
        items: object[];
        zIndex?: number;
        transitionOptions?: any[];
    }): void;
}

export { TJSContextMenu };

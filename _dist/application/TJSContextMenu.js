import { TJSContextMenu as TJSContextMenuImpl }  from '@typhonjs-fvtt/svelte-standard/component';

/**
 * Provides game wide menu functionality.
 */
export class TJSContextMenu
{
   /**
    * Stores any active context menu.
    */
   static #contextMenu = void 0;

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
   static create({ id = '', x = 0, y = 0, items = [], zIndex = 10000, ...transitionOptions } = {})
   {
      if (this.#contextMenu !== void 0) { return; }

      // Filter items for any condition that prevents display.
      const filteredItems = items.filter((item) => item.condition === void 0 ? true :
       typeof item.condition === 'function' ? item.condition() : item.condition);

      // Create the new context menu with the last click x / y point.
      this.#contextMenu = new TJSContextMenuImpl({
         target: document.body,
         intro: true,
         props: { id, x, y, items: filteredItems, zIndex, transitionOptions: { duration: 200, ...transitionOptions } }
      });

      // Register an event listener to remove any active context menu if closed from a menu selection or pointer
      // down event to `document.body`.
      this.#contextMenu.$on('close', () => { this.#contextMenu = void 0; });
   }
}

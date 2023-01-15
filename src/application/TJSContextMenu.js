import { TJSContextMenu as TJSContextMenuImpl } from '@typhonjs-fvtt/svelte-standard/component';

import { A11yHelper }                           from '@typhonjs-svelte/lib/util';

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
    * Creates and manages a browser wide context menu. The best way to create the context menu is to pass in the source
    * DOM event as it is processed for the location of the context menu to display. Likewise a FocusOptions object is
    * generated that allows focus to be returned to the source location. You may supply a default focus target as a
    * fallback.
    *
    * @param {object}      opts - Optional parameters.
    *
    * @param {string}      [opts.id] - A custom CSS ID to add to the menu. This CSS style targeting.
    *
    * @param {KeyboardEvent|MouseEvent}  [opts.event] - The source MouseEvent or KeyboardEvent.
    *
    * @param {boolean}     [opts.focusDebug] - When true the associated FocusOptions object will log focus target data
    *                                          when applied.
    *
    * @param {HTMLElement|string} [opts.focusEl] - A specific HTMLElement or selector string as the default focus
    *                                              target.
    *
    * @param {number}      [opts.x] - X position override for the top / left of the menu.
    *
    * @param {number}      [opts.y] - Y position override for the top / left of the menu.
    *
    * @param {object[]}    [opts.items] - Menu items to display.
    *
    * @param {number}      [opts.zIndex=10000] - Z-index for context menu.
    *
    * @param {number}      [opts.duration] - Transition option for duration of transition.
    *
    * @param {Function}    [opts.easing] - Transition option for easing function.
    *
    * @param {Record<string, string>}  [opts.styles] - Optional inline styles to apply.
    */
   static create({ id = '', event, focusDebug = false, focusEl, x, y, items = [], zIndex = 10000, duration = 200,
    easing, styles } = {})
   {
      if (this.#contextMenu !== void 0) { return; }

      if (!event && (typeof x !== 'number' || typeof y !== 'number'))
      {
         throw new Error (`TJSContextMenu.create error: No event or absolute X / Y position not defined.`);
      }

      if (event !== void 0 && !(event instanceof KeyboardEvent) && !(event instanceof MouseEvent))
      {
         throw new TypeError(`TJSContextMenu.create error: 'event' is not a KeyboardEvent or MouseEvent.`);
      }

      const focusOptions = A11yHelper.getFocusOptions({ event, x, y, focusEl, debug: focusDebug });

      // Filter items for any condition that prevents display.
      const filteredItems = items.filter((item) => item.condition === void 0 ? true :
       typeof item.condition === 'function' ? item.condition() : item.condition);

      // Create the new context menu with the last click x / y point.
      this.#contextMenu = new TJSContextMenuImpl({
         target: document.body,
         intro: true,
         props: {
            id,
            x: focusOptions.x,
            y: focusOptions.y,
            items: filteredItems,
            zIndex,
            focusOptions,
            transitionOptions: { duration, easing },
            styles
         }
      });

      // Register an event listener to remove any active context menu if closed from a menu selection or pointer
      // down event to `document.body`.
      this.#contextMenu.$on('close', () => { this.#contextMenu = void 0; });
   }
}

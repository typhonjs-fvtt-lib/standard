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
    * @param {object}      opts - Optional parameters.
    *
    * @param {string}      [opts.id] - A custom CSS ID to add to the menu.
    *
    * @param {KeyboardEvent|MouseEvent}  [opts.event] - The source MouseEvent or KeyboardEvent
    *
    * @param {number}      [opts.x] - X position for the top / left of the menu.
    *
    * @param {number}      [opts.y] - Y position for the top / left of the menu.
    *
    * @param {object[]}    opts.items - Menu items to display.
    *
    * @param {number}      [opts.zIndex=10000] - Z-index for context menu.
    *
    * @param {number}      [opts.duration] - Transition option for duration of transition.
    *
    * @param {Function}    [opts.easing] - Transition option for easing function.
    *
    * @param {Record<string, string>}  [opts.styles] - Optional inline styles to apply.
    */
   static create({ id = '', event, focusEl, x, y, items = [], zIndex = 10000, duration = 200, easing, styles } = {})
   {
      if (this.#contextMenu !== void 0) { return; }

      if (!event && (typeof x !== 'number' || typeof y !== 'number'))
      {
         throw new Error (`TJSContextMenu.create error: No event or absolute X / Y position not defined.`);
      }

      const focusOptions = this.getFocusOptions({ event, x, y, focusEl });

console.log(`!! TJSContextMenu - create - 0 - focusOptions: `, focusOptions);

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

   /**
    * @param {object} options - Options
    *
    * @param {KeyboardEvent|MouseEvent}   [options.event] -
    *
    * @param {number}   [options.x] -
    *
    * @param {number}   [options.y] -
    *
    * @param {HTMLElement|string} [options.focusEl] -
    *
    * @returns {{}}
    *
    * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1426671
    * @see https://bugzilla.mozilla.org/show_bug.cgi?id=314314
    */
   static getFocusOptions({ event, x, y, focusEl } = {})
   {
      if (focusEl !== void 0 && focusEl instanceof HTMLElement && typeof focusEl !== 'string')
      {
         throw new TypeError(
          `A11yHelper.getFocusOptions error: 'focusEl' is not a HTMLElement or string.`);
      }

      // Handle the case when no event is provided and x, y, or focusEl is explicitly defined.
      if (event === void 0)
      {
         if (typeof x !== 'number')
         {
            throw new TypeError(`A11yHelper.getFocusOptions error: 'event' not defined and 'x' is not a number.`);
         }

         if (typeof y !== 'number')
         {
            throw new TypeError(`A11yHelper.getFocusOptions error: 'event' not defined and 'y' is not a number.`);
         }

         return {
            x,
            y,
            focusEl
         }
      }

      if (!(event instanceof KeyboardEvent) && !(event instanceof MouseEvent))
      {
         throw new TypeError(`A11yHelper.getFocusOptions error: 'event' is not a KeyboardEvent or MouseEvent.`);
      }

      if (x !== void 0 && typeof x !== 'number')
      {
         throw new TypeError(`A11yHelper.getFocusOptions error: 'x' is not a number.`);
      }

      if (y !== void 0 && typeof y !== 'number')
      {
         throw new TypeError(`A11yHelper.getFocusOptions error: 'y' is not a number.`);
      }

      /** @type {HTMLElement} */
      const targetEl = event.target;

      if (!(targetEl instanceof HTMLElement))
      {
         throw new TypeError(`A11yHelper.getFocusOptions error: 'event.target' is not an HTMLElement.`);
      }

      const result = {};

console.log(`!! TJSContextMenu - getFocusOptions - 0`)
      // TODO: Verify that touch long press / contextmenu is detected by button being 2.
      // Assume a keyboard source if `event.button` is not 2.
      if (event?.button !== 2)
      {
console.log(`!! TJSContextMenu - getFocusOptions - A`)

         // Firefox currently (1/23) does not correctly determine the location of a keyboard originated
         // context menu location, so calculate position from middle of the event target.

         const rect = targetEl.getBoundingClientRect();
         result.x = x ?? rect.left + (rect.width / 2);
         result.y = y ?? rect.top + (rect.height / 2);
         result.focusEl = focusEl ?? targetEl;
         result.source = 'keyboard'
      }
      else
      {
console.log(`!! TJSContextMenu - getFocusOptions - B`)
         result.x = x ?? event.pageX;
         result.y = y ?? event.pageY;
         result.focusEl = focusEl;
      }

      return result;
   }
}

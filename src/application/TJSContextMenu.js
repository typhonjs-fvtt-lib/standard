import { TJSContextMenu as TJSContextMenuImpl } from '@typhonjs-fvtt/svelte-standard/component';

import {
   A11yHelper,
   isIterable,
   isObject,
   isSvelteComponent }                          from '@typhonjs-svelte/lib/util';

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
    * @param {string}      [opts.id] - A custom CSS ID to add to the menu. This allows CSS style targeting.
    *
    * @param {KeyboardEvent|MouseEvent}  [opts.event] - The source MouseEvent or KeyboardEvent.
    *
    * @param {number}      [opts.x] - X position override for the top / left of the menu.
    *
    * @param {number}      [opts.y] - Y position override for the top / left of the menu.
    *
    * @param {Iterable<TJSContextMenuItemData>} [opts.items] - Menu items to display.
    *
    * @param {boolean}     [opts.focusDebug] - When true the associated FocusOptions object will log focus target data
    *                                          when applied.
    *
    * @param {HTMLElement|string} [opts.focusEl] - A specific HTMLElement or selector string as the default focus
    *                                              target.
    *
    * @param {string}      [opts.keyCode='Enter'] - Key to select menu items.
    *
    * @param {Record<string, string>}  [opts.styles] - Optional inline styles to apply.
    *
    * @param {number}      [opts.zIndex=Number.MAX_SAFE_INTEGER - 100] - Z-index for context menu.
    *
    * @param {number}      [opts.duration] - Transition option for duration of transition.
    *
    * @param {Function}    [opts.easing] - Transition option for easing function.
    */
   static create({ id = '', event, x, y, items, focusDebug = false, focusEl, keyCode = 'Enter', styles,
    zIndex = Number.MAX_SAFE_INTEGER - 100, duration = 200, easing, } = {})
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
      // const filteredItems = items.filter((item) => item.condition === void 0 ? true :
      //  typeof item.condition === 'function' ? item.condition() : item.condition);

      // Create the new context menu with the last click x / y point.
      this.#contextMenu = new TJSContextMenuImpl({
         target: document.body,
         intro: true,
         props: {
            id,
            x: focusOptions.x,
            y: focusOptions.y,
            items: this.#processItems(items),
            focusOptions,
            keyCode,
            styles,
            transitionOptions: { duration, easing },
            zIndex
         }
      });

      // Register an event listener to remove any active context menu if closed from a menu selection or pointer
      // down event to `document.body`.
      this.#contextMenu.$on('close', () => { this.#contextMenu = void 0; });
   }

   /**
    * @param {Iterable<TJSContextMenuItemData>} items -
    */
   static #processItems(items)
   {
      if (!isIterable(items)) { throw new TypeError(`TJSContextMenu error: 'items' is not an iterable list.`); }

      const tempList = items;
      const tempItems = [];

      let cntr = -1;

      for (const item of tempList)
      {
         cntr++;
         if (!isObject(item)) { throw new TypeError(`TJSContextMenu error: 'item[${cntr}]' is not an object.`); }

         // Filter items for any condition that prevents display.
         if (typeof item.condition === 'function' && !item.condition()) { continue; }
         if (typeof item.condition === 'boolean' && !item.condition) { continue; }

         let type;

         if (isSvelteComponent(item.class)) { type = 'class'; }
         else if (typeof item.icon === 'string') { type = 'icon'; }
         else if (typeof item.image === 'string') { type = 'image'; }
         else if (typeof item.separator === 'string')
         {
            if (item.separator !== 'hr')
            {
               throw new Error (
                `TJSContextMenu error: 'item[${cntr}]' has unknown separator type; only 'hr' is currently supported.`)
            }

            type = 'separator-hr';
         }

         if (type === void 0) { throw new TypeError(`TJSContextMenu error: Unknown type for 'item[${cntr}]'.`); }

         tempItems.push({ ...item, '#type': type });
      }

      return tempItems;
   }
}

/**
 * @typedef {object} TJSContextMenuItemData
 *
 * @property {Function} [callback] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 * @property {Function} [onclick] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 * @property {Function} [onClick] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 * @property {Function} [onPress] - A single callback function to invoke. onPress -> callback -> onClick -> onclick
 *
 * @property {boolean|Function} [condition] - If a boolean and false or a function that invoked returns a falsy value
 *                                            this item is not added.
 *
 *
 * @property {Function} [class] - A Svelte component class.
 *
 * @property {object} [props] - An object passed on as props for any Svelte component.
 *
 *
 * @property {string} [icon] - A string containing icon classes.
 *
 *
 * @property {string} [image] - An image icon path.
 *
 * @property {string} [imageAlt] - An image 'alt' text description.
 *
 *
 * @property {string} [label] - A text string that is passed through localization.
 *
 * @property {'hr'} [separator] - A menu item separator; only 'hr' supported.
 */

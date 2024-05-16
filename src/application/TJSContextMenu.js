import { TJSContextMenuImpl } from '#standard/component';

import { getEasingFunc }      from '#runtime/svelte/easing';
import { TJSSvelteUtil }      from '#runtime/svelte/util';

import { A11yHelper }         from '#runtime/util/browser';

import {
   isIterable,
   isObject }                 from '#runtime/util/object';

/**
 * Provides and manages browser window wide context menu functionality. The best way to create a context menu is to
 * attach the source KeyboardEvent or MouseEvent / PointerEvent as data in {@link TJSContextMenu.create}. This allows
 * proper keyboard handling across browsers supporting the context menu key. A A11yFocusSource data object is generated
 * which allows tracking of the source element that triggered the context menu allowing focus to return to the source
 * when the context menu is closed. This A11yFocusSource object is also forwarded on through the `onPress` callback and
 * is intended to be supplied as `SvelteApplication` options particularly for modal dialogs allowing focus to return
 * to the original source after the modal dialog is closed.
 */
export class TJSContextMenu
{
   /**
    * Stores any active context menu.
    */
   static #contextMenu = void 0;

   /**
    * Provides the event constructor names to duck type against. This is necessary for when HTML nodes / elements are
    * moved to another browser window as `instanceof` checks will fail.
    *
    * @type {Set<string>}
    */
   static #eventTypes = new Set(['KeyboardEvent', 'MouseEvent', 'PointerEvent']);

   /**
    * Creates and manages a browser wide context menu. The best way to create the context menu is to pass in the source
    * DOM event as it is processed for the location of the context menu to display. Likewise, a A11yFocusSource object
    * is generated that allows focus to be returned to the source location. You may supply a default focus target as a
    * fallback via `focusEl`.
    *
    * @param {object}      opts - Optional parameters.
    *
    * @param {string}      [opts.id] - A custom CSS ID to add to the menu. This allows CSS style targeting.
    *
    * @param {KeyboardEvent | MouseEvent}  [opts.event] - The source MouseEvent or KeyboardEvent.
    *
    * @param {number}      [opts.x] - X position override for the top / left of the menu.
    *
    * @param {number}      [opts.y] - Y position override for the top / left of the menu.
    *
    * @param {number}      [opts.offsetX=2] - Small positive integer offset for context menu so the pointer / mouse is
    *        over the menu on display.
    *
    * @param {number}      [opts.offsetY=2] - Small positive integer offset for context menu so the pointer / mouse is
    *        over the menu on display.
    *
    * @param {Iterable<TJSContextMenuItemData>} [opts.items] - Menu items to display.
    *
    * @param {boolean}     [opts.focusDebug] - When true the associated A11yFocusSource object will log focus target
    *        data when applied.
    *
    * @param {HTMLElement|string} [opts.focusEl] - A specific HTMLElement or selector string as the default focus
    *        target.
    *
    * @param {string}      [opts.keyCode='Enter'] - Key to select menu items.
    *
    * @param {Record<string, string>}  [opts.styles] - Optional inline styles to apply.
    *
    * @param {number}      [opts.zIndex=Number.MAX_SAFE_INTEGER - 100] - Z-index for context menu.
    *
    * @param {number}      [opts.duration] - Transition option for duration of transition.
    *
    * @param {import('#runtime/svelte/easing').EasingReference}   [opts.easing] - Transition option for ease. Either an
    *        easing function or easing function name.
    *
    * @param {Window}      [opts.activeWindow=globalThis] - The active browser window that the context menu is
    *        displaying inside.
    */
   static create({ id = '', event, x, y, items, offsetX = 2, offsetY = 2, focusDebug = false, focusEl,
    keyCode = 'Enter', styles, zIndex = Number.MAX_SAFE_INTEGER - 100, duration = 200, easing,
     activeWindow } = {})
   {
      if (this.#contextMenu !== void 0) { return; }

      if (!event && (typeof x !== 'number' || typeof y !== 'number'))
      {
         throw new Error(`TJSContextMenu.create error: No event or absolute X / Y position not defined.`);
      }

      if (Number.isInteger(offsetX) && offsetX < 0)
      {
         throw new TypeError(`TJSContextMenu.create error: offsetX is not a positive integer.`);
      }

      if (Number.isInteger(offsetY) && offsetY < 0)
      {
         throw new TypeError(`TJSContextMenu.create error: offsetY is not a positive integer.`);
      }

      // Perform duck typing on event constructor name.
      if (event !== void 0 && !TJSContextMenu.#eventTypes.has(event?.constructor?.name))
      {
         throw new TypeError(
          `TJSContextMenu.create error: 'event' is not a KeyboardEvent, MouseEvent, or PointerEvent.`);
      }

      // If `activeWindow` is not defined determine it from the given event or fallback to `globalThis`.
      if (activeWindow === void 0)
      {
         activeWindow = event !== void 0 ? event?.target?.ownerDocument?.defaultView : globalThis;
      }

      if (Object.prototype.toString.call(activeWindow) !== '[object Window]')
      {
         throw new TypeError(`TJSContextMenu.create error: 'activeWindow' is not a Window / WindowProxy.`);
      }

      const focusSource = A11yHelper.getFocusSource({ event, x, y, focusEl, debug: focusDebug });

      const easingFn = getEasingFunc(easing, { default: false });

      // Create the new context menu with the last click x / y point.
      this.#contextMenu = new TJSContextMenuImpl({
         target: activeWindow.document.body,
         intro: true,
         props: {
            id,
            x: focusSource.x,
            y: focusSource.y,
            offsetX,
            offsetY,
            items: this.#processItems(items),
            focusSource,
            keyCode,
            styles,
            transitionOptions: { duration, easing: easingFn },
            zIndex,
            activeWindow
         }
      });

      // Register an event listener to remove any active context menu if closed from a menu selection or pointer
      // down event to `document.body`.
      this.#contextMenu.$on('close:contextmenu', () => { this.#contextMenu = void 0; });
   }

   /**
    * Processes menu item data for conditions and evaluating the type of menu item.
    *
    * @param {Iterable<TJSContextMenuItemData>} items - Menu item data.
    *
    * @returns {object[]} Processed menu items.
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

         if (TJSSvelteUtil.isComponent(item.class)) { type = 'class'; }
         else if (typeof item.icon === 'string') { type = 'icon'; }
         else if (typeof item.image === 'string') { type = 'image'; }
         else if (item.icon === void 0 && item.image === void 0 && typeof item.label === 'string') { type = 'label'; }
         else if (typeof item.separator === 'string')
         {
            if (item.separator !== 'hr')
            {
               throw new Error(
                `TJSContextMenu error: 'item[${cntr}]' has unknown separator type; only 'hr' is currently supported.`);
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
 * @typedef {object} TJSContextMenuItemData Defines a menu item entry. Depending on the item data that is passed
 * into the menu you can define 4 types of items: 'icon / label', 'image / label', 'class / Svelte component', and
 * 'separator / hr'. A single callback function `onPress` is supported.
 *
 * @property {(item: TJSContextMenuItemData, object) => void} [onPress] A callback function that receives the selected
 * item data and an object containing the A11yFocusSource data that can be passed to any Application / particularly
 * modal dialogs returning focus when closed.
 *
 * @property {boolean|(() => boolean)} [condition] If a boolean and false or a function that invoked returns a falsy
 * value this item is not added.
 *
 * @property {Function} [class] A Svelte component class.
 *
 * @property {object} [props] An object passed on as props for any Svelte component.
 *
 *
 * @property {string} [icon] A string containing icon classes.
 *
 *
 * @property {string} [image] An image icon path.
 *
 * @property {string} [imageAlt] An image 'alt' text description.
 *
 *
 * @property {string} [label] A text string that is passed through localization.
 *
 * @property {'hr'} [separator] A menu item separator; only 'hr' supported.
 */

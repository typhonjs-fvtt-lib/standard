import {
   isObject,
   parseSvelteConfig,
   styleParsePixels }   from '@typhonjs-fvtt/svelte/util';

import {
   FVTTSidebarButton,
   FVTTSidebarTab }     from '@typhonjs-fvtt/svelte-standard/component/fvtt';

/**
 * Provides the ability to mount and control Svelte component based sidebar tabs in the Foundry sidebar.
 */
export class FVTTSidebarControl
{
   static #data = [];

   /**
    * @param {object}   data -
    *
    * @param {string}   data.beforeId - The ID for the tab to place the new sidebar before. This must be an existing
    *        sidebar tab ID. THe stock Foundry sidebar tab IDs from left to right are:
    *
    * @param {string}   data.id - The Sidebar ID / name.
    *
    * @param {string}   data.icon - The FontAwesome icon css classes.
    *
    * @param {string}   [data.tooltip] - The tooltip text or i18n lang key.
    */
   static add(data)
   {
      if (!isObject(data)) { throw new TypeError(`FVTTSidebarControl.add error: 'data' is not an object.`); }

      if (typeof data.beforeId !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'data.beforeId' is not a string.`);
      }

      if (typeof data.id !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'data.id' is not a string.`);
      }

      if (typeof data.icon !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'data.icon' is not a string.`);
      }

      if (data.tooltip !== void 0 && typeof data.tooltip !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'data.tooltip' is not a string.`);
      }

      let svelteConfig;

      try
      {
         svelteConfig = parseSvelteConfig(data);
      }
      catch (err)
      {
         throw new TypeError(`FVTTSidebarControl.add error; ${err.message}`);
      }

      if (this.#data.length === 0)
      {
         Hooks.once('renderSidebar', () => this.#addSidebars());
      }

      this.#data.push({
         ...data,
         svelteConfig
      });
   }

   /**
    */
   static #addSidebars()
   {
      // Retrieve Foundry sidebar and sidebar tabs elements.
      const sidebarEl = document.querySelector('#sidebar');
      const tabsEl = document.querySelector('#sidebar-tabs');

      if (!(sidebarEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#addSidebars error - Could not locate sidebar with '#sidebar' selector.`);
      }

      if (!(tabsEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#addSidebars error - Could not locate sidebar tabs with '#sidebar-tabs' selector.`);
      }

      // Stores the initial sidebar width.
      const initialSidebarWidth = styleParsePixels(globalThis?.getComputedStyle(sidebarEl)?.width);

      // Stores the cumulative width of all sidebar tab buttons added to increase the width of the sidebar element.
      let addedButtonsWidth = 0;

      for (const sidebar of this.#data)
      {
         const anchorButtonEl = tabsEl.querySelector(`[data-tab=${sidebar.beforeId}]`);

         if (!(anchorButtonEl instanceof HTMLElement))
         {
            throw new TypeError(
             `FVTTSidebarControl.#addSidebars error - Could not locate sidebar tab for 'beforeId': ${
               sidebar.beforeId}.`);
         }

         const buttonComp = new FVTTSidebarButton({
            target: tabsEl,
            anchor: anchorButtonEl,
            props: {
               sidebar
            }
         });

         // Get width of button to increase sidebar element width CSS var.
         addedButtonsWidth += styleParsePixels(globalThis.getComputedStyle(buttonComp.elementRoot).width);

         // -------------------

         // Note: The new sidebar tab section is added at the end of the `section` elements and this is fine.
         new FVTTSidebarTab({
            target: sidebarEl,
            props: {
               sidebar
            }
         });

         // Fake the bare minimum API necessary for a Foundry sidebar tab which is added to `globalThis.ui`.
         globalThis.ui[`${sidebar.id}`] = {
            renderPopout(id) {},    // Render pop out version of the sidebar.
            render() {}             // Added as sanity measure.
         };
      }

      // Set the Foundry CSS variable controlling the sidebar element width w/ the additional sidebar tab buttons
      // cumulative width.
      document.querySelector(':root').style.setProperty('--sidebar-width',
       `${initialSidebarWidth + addedButtonsWidth}px`);
   }
}

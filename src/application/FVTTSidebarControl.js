import { SvelteApplication }  from '@typhonjs-fvtt/svelte/application';

import {
   FVTTSidebarPopout,
   FVTTSidebarTab,
   FVTTSidebarWrapper }       from '@typhonjs-fvtt/svelte-standard/component/fvtt';

import {
   isObject,
   parseSvelteConfig,
   styleParsePixels }         from '@typhonjs-fvtt/svelte/util';

/**
 * Provides the ability to mount and control Svelte component based sidebar tabs in the Foundry sidebar.
 */
export class FVTTSidebarControl
{
   /**
    * @type {object[]}
    */
   static #initData = [];

   /**
    * @type {Map<string, object>}
    */
   static #sidebars = new Map();

   /**
    * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
    *
    * @param {string}   sidebarData.id - The unique Sidebar ID / name. Used for CSS ID and retrieving the sidebar.
    *
    * @param {string}   sidebarData.icon - The FontAwesome icon css classes.
    *
    * @param {object}   sidebarData.svelte - A Svelte configuration object.
    *
    * @param {string}   [sidebarData.beforeId] - The ID for the tab to place the new sidebar before. This must be an
    *        existing sidebar tab ID. THe stock Foundry sidebar tab IDs from left to right are:
    *
    * @param {string}   [sidebarData.popoutOptions] - Provides SvelteApplication options overrides.
    *
    * @param {string}   [sidebarData.title] - The popout application title text or i18n lang key.
    *
    * @param {string}   [sidebarData.tooltip] - The sidebar tab tooltip text or i18n lang key.
    */
   static add(sidebarData)
   {
      if (!isObject(sidebarData))
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData' is not an object.`);
      }

      if (typeof sidebarData.id !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.id' is not a string.`);
      }

      if (typeof sidebarData.icon !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.icon' is not a string.`);
      }

      if (sidebarData.beforeId !== void 0 && typeof sidebarData.beforeId !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.beforeId' is not a string.`);
      }

      if (sidebarData.title !== void 0 && typeof sidebarData.title !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.title' is not a string.`);
      }

      if (sidebarData.tooltip !== void 0 && typeof sidebarData.tooltip !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.tooltip' is not a string.`);
      }

      let svelteConfig;

      try
      {
         svelteConfig = parseSvelteConfig(sidebarData.svelte);
      }
      catch (err)
      {
         throw new TypeError(`FVTTSidebarControl.add error; ${err.message}`);
      }

      if (this.#initData.length === 0)
      {
         Hooks.once('renderSidebar', () => this.#initialize());
      }

      const sidebar = {
         ...sidebarData,
         svelteConfig
      };

      sidebar.popoutOptions = {
         // Default SvelteApplication options.
         id: `${sidebarData.id}-popout`,
         title: sidebarData.title ?? sidebarData.tooltip,
         classes: ['tab', 'sidebar-tab', 'sidebar-popout'],
         height: 'auto',
         width: 300,
         svelte: {
            class: FVTTSidebarPopout,
            target: document.body,
            props: {
               sidebarData: sidebar
            }
         },

         // Allow overriding of SvelteApplication options.
         ...(sidebarData.popoutOptions ?? {})
      };

      this.#initData.push(sidebar);
   }

   /**
    */
   static #initialize()
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

      for (const sidebarData of this.#initData)
      {
         let anchorButtonEl;

         // Attempt to find the `beforeId` tab to set as the before anchor when mounting new sidebar button.
         if (sidebarData.beforeId)
         {
            anchorButtonEl = tabsEl.querySelector(`[data-tab=${sidebarData.beforeId}]`);

            if (!(anchorButtonEl instanceof HTMLElement))
            {
               throw new TypeError(
                `FVTTSidebarControl.#addSidebars error - Could not locate sidebar tab for 'beforeId': ${
                 sidebarData.beforeId}.`);
            }
         }

         const sidebarTab = new FVTTSidebarTab({
            target: tabsEl,
            anchor: anchorButtonEl,
            props: {
               sidebarData
            }
         });

         // Get width of the tab to increase sidebar element width CSS var.
         addedButtonsWidth += styleParsePixels(globalThis.getComputedStyle(sidebarTab.anchorEl).width);

         // -------------------

         // Note: The new sidebar tab section is added at the end of the `section` elements and this is fine.
         const sidebarWrapper = new FVTTSidebarWrapper({
            target: sidebarEl,
            props: {
               sidebarData
            }
         });

         // Fake the bare minimum API necessary for a Foundry sidebar tab which is added to `globalThis.ui`.
         globalThis.ui[`${sidebarData.id}`] = {
            // Render pop out version of the sidebar. Invoked on context click of sidebar tab button.
            renderPopout: () =>
            {
               const entry = this.get(sidebarData.id);

               // Create a new popout app for the sidebar if none exists.
               if (entry.popout === void 0) { entry.popout = new SvelteApplication(sidebarData.popoutOptions); }

               entry.popout.render(true, { focus: true });
            },
            render() {}             // No-op; added as sanity measure.
         };

         this.#sidebars.set(sidebarData.id, {
            data: sidebarData,
            tab: sidebarTab,
            wrapper: sidebarWrapper
         });
      }

      // Set the Foundry CSS variable controlling the sidebar element width w/ the additional sidebar tab buttons
      // cumulative width.
      document.querySelector(':root').style.setProperty('--sidebar-width',
       `${initialSidebarWidth + addedButtonsWidth}px`);
   }

   /**
    * Returns a loaded and configured sidebar entry by ID.
    *
    * @param {string}   id -
    *
    * @returns {object} The sidebar entry.
    */
   static get(id)
   {
      return this.#sidebars.get(id);
   }
}

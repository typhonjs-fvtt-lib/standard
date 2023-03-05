import { SvelteApplication }  from '@typhonjs-fvtt/svelte/application';

import {
   FVTTSidebarPopout,
   FVTTSidebarTab,
   FVTTSidebarWrapper }       from '@typhonjs-fvtt/svelte-standard/component/fvtt';

import {
   hasPrototype,
   isObject,
   parseSvelteConfig,
   ManagedPromise,
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

   static #initPromise = new ManagedPromise();

   /**
    * @type {Map<string, TJSSidebarEntry>}
    */
   static #sidebars = new Map();

   /**
    * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
    *
    * @param {string}   sidebarData.id - The unique Sidebar ID / name. Used for CSS ID and retrieving the sidebar.
    *
    * @param {string|object}  sidebarData.icon - The FontAwesome icon css classes _or_ a Svelte configuration object
    * to load a custom Svelte component to use as the "icon".
    *
    * @param {object}   sidebarData.svelte - A Svelte configuration object.
    *
    * @param {string}   [sidebarData.beforeId] - The ID for the tab to place the new sidebar before. This must be an
    *        existing sidebar tab ID. THe stock Foundry sidebar tab IDs from left to right are:
    *
    * @param {string}   [sidebarData.popoutApplication] - Provides a custom SvelteApplication class to instantiate
    *        for the popout sidebar.
    *
    * @param {string}   [sidebarData.popoutOptions] - Provides SvelteApplication options overrides for the default
    *        popout sidebar.
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

      if (typeof sidebarData.icon !== 'string' && !isObject(sidebarData.icon))
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.icon' is not a string or object.`);
      }

      if (sidebarData.beforeId !== void 0 && typeof sidebarData.beforeId !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.beforeId' is not a string.`);
      }

      if (sidebarData.popoutApplication !== void 0 && !hasPrototype(sidebarData.popoutApplication, SvelteApplication))
      {
         throw new TypeError(
          `FVTTSidebarControl.add error: 'sidebarData.popoutApplication' is not a SvelteApplication.`);
      }

      if (sidebarData.popoutOptions !== void 0 && !isObject(sidebarData.popoutOptions))
      {
         throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.popoutOptions' is not an object.`);
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
         throw new TypeError(`FVTTSidebarControl.add error parsing 'sidebarData.svelte'; ${err.message}`);
      }

      // Parse any icon defined as a Svelte configuration object.

      let iconSvelteConfig;

      if (isObject(sidebarData.icon))
      {
         try
         {
            iconSvelteConfig = parseSvelteConfig(sidebarData.icon);
         }
         catch (err)
         {
            throw new TypeError(`FVTTSidebarControl.add error parsing 'sidebarData.icon'; ${err.message}`);
         }
      }

      if (this.#initData.length === 0)
      {
         this.#initPromise.create();

         Hooks.once('renderSidebar', () => this.#initialize());
      }

      const sidebar = {
         ...sidebarData,
         svelteConfig,
         iconSvelteConfig
      };

      // Defines the default options to use when `popoutApplication` is not defined.
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
    * Initializes all sidebars registered after the initial Foundry Sidebar app has been rendered.
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

         /** @type {TJSSidebarEntry} */
         const sidebarEntry = {
            data: sidebarData,
            popout: sidebarData.popoutApplication !== void 0 ? new sidebarData.popoutApplication() :
               new SvelteApplication(sidebarData.popoutOptions),
            tab: sidebarTab,
            wrapper: sidebarWrapper
         };

         Object.freeze(sidebarEntry);

         // Fake the bare minimum API necessary for a Foundry sidebar tab which is added to `globalThis.ui`.
         globalThis.ui[`${sidebarData.id}`] = {
            /**
             * Provides an accessor to retrieve the popout application as a sanity case.
             *
             * @returns {SvelteApplication} The popout application.
             * @protected
             */
            get _popout()
            {
               return sidebarEntry?.popout;
            },

            /**
             * Renders the popout application and is invoked by {@link Sidebar} when the sidebar tab is right-clicked.
             *
             * @returns {SvelteApplication} Popout application.
             */
            renderPopout: () => sidebarEntry?.popout?.render?.(true, { focus: true }),

            /**
             * No-op; added as sanity measure.
             */
            render() {}
         };

         this.#sidebars.set(sidebarData.id, sidebarEntry);
      }

      // Set the Foundry CSS variable controlling the sidebar element width w/ the additional sidebar tab buttons
      // cumulative width.
      document.querySelector(':root').style.setProperty('--sidebar-width',
       `${initialSidebarWidth + addedButtonsWidth}px`);

      this.#initPromise.resolve(this);
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

   /**
    * Provides a Promise that is resolved after all added sidebars are initialized. This is useful when additional
    * setup or configuration of sidebars needs to be performed after sidebar initialization.
    *
    * @returns {Promise} Initialization Promise.
    */
   static wait()
   {
      return this.#initPromise.get();
   }
}

/**
 * @typedef {object} TJSSidebarEntry
 *
 * @property {object}               data - The sidebar data that configures a Svelte sidebar.
 *
 * @property {SvelteApplication}    popout - The sidebar popout application.
 *
 * @property {FVTTSidebarTab}       tab - The tab wrapper component.
 *
 * @property {FVTTSidebarWrapper}   wrapper - The sidebar wrapper component.
 */

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
 * Provides the ability to mount and control Svelte component based sidebar panels & tabs in the Foundry sidebar.
 *
 * To add a new sidebar tab schedule one or more invocations of {@link FVTTSidebarControl.add} in a `setup` hook. You
 * must add all sidebars in the `setup` hook before the main Foundry sidebar renders. Please review all the expanded
 * options available in the configuration object passed to the `add` method. At minimum, you need to provide a unique
 * `id`, `icon`, and `svelte` configuration object. You almost always will want to provide `beforeId` referencing
 * another existing sidebar tab ID to place the tab button before. If undefined the tab is inserted at the end of
 * the sidebar tabs. The default Foundry sidebar tab IDs from left to right are: 'chat', 'combat', 'scenes', 'actors',
 * 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
 *
 * The nice thing about FVTTSidebarControl is that all you have to provide is the sidebar component and the rest is
 * handled for you including automatically widening the width of the sidebar to fit the new sidebar tab. Also by default
 * an adhoc SvelteApplication is configured to display the sidebar when popped out automatically without the need to
 * associate an app instance.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * Optionally:
 * - You can define the `icon` as a Svelte configuration object to load an interactive component instead of
 * using a FontAwesome icon. This allows you to dynamically show state similar to the chat log sidebar when activity
 * occurs or for other purposes.
 *
 * - You can provide `popoutOptions` overriding the default options passed to the default adhoc SvelteApplication
 * rendered for the popout.
 *
 * - You can provide a class that extends from SvelteApplication as `popoutApplication` to provide a fully customized
 * popout sidebar that you fully control.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * The {@link FVTTSidebarControl.get} method allows you to retrieve the associated {@link TJSSidebarEntry} for a given
 * sidebar by ID allowing access to the configuration data, popout app, and wrapper components that mount the sidebar.
 *
 * The {@link FVTTSidebarControl.wait} returns a Promise that is resolved after all sidebars have been initialized.
 * allowing handling any special setup as necessary.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * @example Minimal setup
 *
 * Hooks.once('setup', () =>
 * {
 *    FVTTSidebarControl.add({
 *       beforeId: 'items',         // Place new tab before the 'items' tab
 *       id: 'test',                // A unique CSS ID
 *       icon: 'fas fa-dice-d10',   // FontAwesome icon
 *       title: 'Test Directory',   // Title of popout sidebar app; can be language string.
 *       tooltip: 'Tests',          // Tooltip for sidebar tab.
 *       svelte: {
 *          class: TestTab          // A Svelte component
 *       }
 *    });
 * });
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
          `FVTTSidebarControl.#initialize error - Could not locate sidebar with '#sidebar' selector.`);
      }

      if (!(tabsEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#initialize error - Could not locate sidebar tabs with '#sidebar-tabs' selector.`);
      }

      // Stores the initial sidebar width.
      const initialSidebarWidth = styleParsePixels(globalThis?.getComputedStyle(sidebarEl)?.width);

      // Stores the cumulative width of all sidebar tab buttons added to increase the width of the sidebar element.
      let addedButtonsWidth = 0;

      for (const sidebarData of this.#initData)
      {
         // Verify if new sidebar ID is not already defined in 'globalThis.ui` indicating that the ID is taken.
         if (globalThis.ui[sidebarData.id] !== void 0)
         {
            throw new Error(`FVTTSidebarControl.#initialize error - 'sidebarData.id' (${
             sidebarData.id}) is already in use in 'globalThis.ui'.`);
         }

         let anchorButtonEl;

         // Attempt to find the `beforeId` tab to set as the before anchor when mounting new sidebar button.
         if (sidebarData.beforeId)
         {
            anchorButtonEl = tabsEl.querySelector(`[data-tab=${sidebarData.beforeId}]`);

            if (!(anchorButtonEl instanceof HTMLElement))
            {
               throw new TypeError(
                `FVTTSidebarControl.#initialize error - Could not locate sidebar tab for 'beforeId': ${
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
    * @param {string}   id - The ID of the sidebar to retrieve.
    *
    * @returns {TJSSidebarEntry} The sidebar entry.
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

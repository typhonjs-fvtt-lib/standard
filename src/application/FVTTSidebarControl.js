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
 * There is a method to remove an existing stock Foundry sidebar {@link FVTTSidebarControl.remove}. It takes
 * a single field `removeId` as one of the existing Foundry sidebar IDs to replace: chat', 'combat', 'scenes',
 * 'actors', 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * There is a method to replace an existing stock Foundry sidebar {@link FVTTSidebarControl.replace}. It takes
 * the same data as the `add` method, but instead of using `id` / `beforeId` you must define `replaceId` as one of the
 * existing Foundry sidebar IDs to replace: chat', 'combat', 'scenes', 'actors', 'items', 'journal', 'tables',
 * 'cards', 'playlists', 'compendium', and 'settings'
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
 *       beforeId: 'items',         // Place new tab before the 'items' tab.
 *       id: 'test',                // A unique CSS ID.
 *       icon: 'fas fa-dice-d10',   // FontAwesome icon.
 *       title: 'Test Directory',   // Title of popout sidebar app; can be language string.
 *       tooltip: 'Tests',          // Tooltip for sidebar tab.
 *       svelte: {                  // A Svelte configuration object.
 *          class: TestTab          // A Svelte component.
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
    * Adds a new Svelte powered sidebar tab / panel.
    *
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
         iconSvelteConfig,
         action: 'add'
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

      /**
       * Stores data used for adding / replacing sidebars.
       *
       * @type {{tabsEl: HTMLElement, sidebarEl: HTMLElement, initialSidebarWidth: number, addedSidebarWidth: number}}
       */
      const data = {
         sidebarEl,
         tabsEl,
         initialSidebarWidth: styleParsePixels(globalThis?.getComputedStyle(sidebarEl)?.width),
         addedSidebarWidth: 0
      };

      for (const sidebarData of this.#initData)
      {
         switch (sidebarData.action)
         {
            case 'add':
               this.#sidebarAdd(data, sidebarData);
               break;

            case 'remove':
               this.#sidebarRemove(data, sidebarData);
               break;

            case 'replace':
               this.#sidebarReplace(data, sidebarData);
               break;
         }
      }

      // Set the Foundry CSS variable controlling the sidebar element width w/ the additional sidebar tab buttons
      // cumulative width.
      document.querySelector(':root').style.setProperty('--sidebar-width',
       `${data.initialSidebarWidth + data.addedSidebarWidth}px`);

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
    * Removes an existing sidebar tab / panel.
    *
    * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
    *
    * @param {string}   sidebarData.removeId - The ID for the sidebar tab to remove. This
    *        must be an existing sidebar tab ID.
    */
   static remove(sidebarData)
   {
      if (!isObject(sidebarData))
      {
         throw new TypeError(`FVTTSidebarControl.remove error: 'sidebarData' is not an object.`);
      }

      if (typeof sidebarData.removeId !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.remove error: 'sidebarData.removeId' is not a string.`);
      }

      // Verify that there is an entry for `sidebarData.removeId` defined in 'CONFIG.ui` indicating that the ID
      // is available to remove.
      if (CONFIG.ui[sidebarData.removeId] === void 0)
      {
         throw new Error(`FVTTSidebarControl.remove error - 'sidebarData.removeId' (${
          sidebarData.removeId}) not found in 'CONFIG.ui'.`);
      }

      // Remove existing Application reference for `sidebarData.removeId`.
      delete CONFIG.ui[sidebarData.removeId];

      if (this.#initData.length === 0)
      {
         this.#initPromise.create();

         Hooks.once('renderSidebar', () => this.#initialize());
      }

      const sidebar = {
         ...sidebarData,
         action: 'remove'
      };

      this.#initData.push(sidebar);
   }

   /**
    * Replaces an existing sidebar tab / panel with a new Svelte powered sidebar.
    *
    * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
    *
    * @param {string|object}  sidebarData.icon - The FontAwesome icon css classes _or_ a Svelte configuration object
    *        to load a custom Svelte component to use as the "icon".
    *
    * @param {string}   sidebarData.replaceId - The ID for the sidebar to replace. This must be an
    *        existing sidebar tab ID.
    *
    * @param {object}   sidebarData.svelte - A Svelte configuration object.
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
   static replace(sidebarData)
   {
      if (!isObject(sidebarData))
      {
         throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData' is not an object.`);
      }

      if (typeof sidebarData.icon !== 'string' && !isObject(sidebarData.icon))
      {
         throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.icon' is not a string or object.`);
      }

      if (typeof sidebarData.replaceId !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.replaceId' is not a string.`);
      }

      if (sidebarData.popoutApplication !== void 0 && !hasPrototype(sidebarData.popoutApplication, SvelteApplication))
      {
         throw new TypeError(
          `FVTTSidebarControl.replace error: 'sidebarData.popoutApplication' is not a SvelteApplication.`);
      }

      if (sidebarData.popoutOptions !== void 0 && !isObject(sidebarData.popoutOptions))
      {
         throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.popoutOptions' is not an object.`);
      }

      if (sidebarData.title !== void 0 && typeof sidebarData.title !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.title' is not a string.`);
      }

      if (sidebarData.tooltip !== void 0 && typeof sidebarData.tooltip !== 'string')
      {
         throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.tooltip' is not a string.`);
      }

      // Store 'id' data duplicating `replaceId`. Used in wrapper Svelte components.
      sidebarData.id = sidebarData.replaceId;

      // Verify that there is an entry for `sidebarData.replaceId` defined in 'CONFIG.ui` indicating that the ID
      // is available to replace.
      if (CONFIG.ui[sidebarData.replaceId] === void 0)
      {
         throw new Error(`FVTTSidebarControl.replace error - 'sidebarData.replaceId' (${
          sidebarData.replaceId}) not found in 'CONFIG.ui'.`);
      }

      // Remove existing Application reference for `sidebarData.replaceId`
      delete CONFIG.ui[sidebarData.replaceId];

      let svelteConfig;

      try
      {
         svelteConfig = parseSvelteConfig(sidebarData.svelte);
      }
      catch (err)
      {
         throw new TypeError(`FVTTSidebarControl.replace error parsing 'sidebarData.svelte'; ${err.message}`);
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
            throw new TypeError(`FVTTSidebarControl.replace error parsing 'sidebarData.icon'; ${err.message}`);
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
         iconSvelteConfig,
         action: 'replace'
      };

      // Defines the default options to use when `popoutApplication` is not defined.
      sidebar.popoutOptions = {
         // Default SvelteApplication options.
         id: `${sidebarData.replaceId}-popout`,
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
    * Handles adding the new Svelte sidebar tab / panel.
    *
    * @param {object}   data - Data for tracking sidebar changes.
    *
    * @param {object}   sidebarData - Sidebar data to add.
    */
   static #sidebarAdd(data, sidebarData)
   {
      // Verify if new sidebar ID is not already defined in 'globalThis.ui` indicating that the ID is taken.
      if (globalThis.ui[sidebarData.id] !== void 0)
      {
         throw new Error(`FVTTSidebarControl.#sidebarAdd error - 'sidebarData.id' (${
          sidebarData.id}) is already in use in 'globalThis.ui'.`);
      }

      let anchorButtonEl;

      // Attempt to find the `beforeId` tab to set as the before anchor when mounting new sidebar button.
      if (sidebarData.beforeId)
      {
         anchorButtonEl = data.tabsEl.querySelector(`[data-tab=${sidebarData.beforeId}]`);

         if (!(anchorButtonEl instanceof HTMLElement))
         {
            throw new TypeError(
             `FVTTSidebarControl.#sidebarAdd error - Could not locate sidebar tab for 'sidebarData.beforeId': ${
              sidebarData.beforeId}.`);
         }
      }

      const sidebarTab = new FVTTSidebarTab({
         target: data.tabsEl,
         anchor: anchorButtonEl,
         props: {
            sidebarData
         }
      });

      // Get width of the tab to increase sidebar element width CSS var.
      data.addedSidebarWidth += styleParsePixels(globalThis.getComputedStyle(sidebarTab.anchorEl).width);

      // -------------------

      let anchorSectionEl;

      // Attempt to find the `beforeId` tab to set as the before anchor when mounting new sidebar.
      if (sidebarData.beforeId)
      {
         // At this moment the core sidebar apps are not rendered yet so are `template` and `section` elements. Also
         // Check for `section` elements in case of indexing by another Svelte sidebar added prior.
         anchorSectionEl = data.sidebarEl.querySelector(`template[data-tab=${sidebarData.beforeId}]`) ??
          data.sidebarEl.querySelector(`section[data-tab=${sidebarData.beforeId}]`);

         if (!(anchorSectionEl instanceof HTMLElement))
         {
            throw new TypeError(
             `FVTTSidebarControl.#sidebarAdd error - Could not locate sidebar for 'sidebarData.beforeId': ${
              sidebarData.beforeId}.`);
         }
      }

      // Note: The new sidebar tab section is added at the end of the `section` elements and this is fine.
      const sidebarWrapper = new FVTTSidebarWrapper({
         target: data.sidebarEl,
         anchor: anchorSectionEl,
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

   /**
    * Handles removing an existing sidebar.
    *
    * @param {object}   data - Data for tracking sidebar changes.
    *
    * @param {object}   sidebarData - Sidebar data to remove.
    */
   static #sidebarRemove(data, sidebarData)
   {
      // Verify that sidebar ID to remove is not already defined in 'globalThis.ui` indicating that the ID is taken.
      if (globalThis.ui[sidebarData.removeId] !== void 0)
      {
         throw new Error(`FVTTSidebarControl.#sidebarRemove error - 'sidebarData.removeId' (${
          sidebarData.removeId}) is already in use in 'globalThis.ui'.`);
      }

      // Attempt to find the `removeId` tab to set as the before anchor when mounting new sidebar button.
      const anchorButtonEl = data.tabsEl.querySelector(`[data-tab=${sidebarData.removeId}]`);

      if (!(anchorButtonEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarRemove error - Could not locate sidebar tab for 'sidebarData.removeId': ${
           sidebarData.removeId}.`);
      }

      // Remove width of the old replaced tab width.
      data.addedSidebarWidth -= styleParsePixels(globalThis.getComputedStyle(anchorButtonEl).width);

      // -------------------

      // Attempt to find the existing `removeId` panel.
      const anchorSectionEl = data.sidebarEl.querySelector(`template[data-tab=${sidebarData.removeId}]`) ??
       data.sidebarEl.querySelector(`section[data-tab=${sidebarData.removeId}]`);

      if (!(anchorSectionEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarRemove error - Could not locate sidebar for 'sidebarData.removeId': ${
           sidebarData.removeId}.`);
      }

      // Remove old sidebar tab / panel.
      anchorButtonEl.remove();
      anchorSectionEl.remove();
   }

   /**
    * Handles replacing an existing sidebar with a new Svelte sidebar tab / panel.
    *
    * @param {object}   data - Data for tracking sidebar changes.
    *
    * @param {object}   sidebarData - Sidebar data to replace.
    */
   static #sidebarReplace(data, sidebarData)
   {
      // Verify if new sidebar ID is not already defined in 'globalThis.ui` indicating that the ID is taken.
      if (globalThis.ui[sidebarData.replaceId] !== void 0)
      {
         throw new Error(`FVTTSidebarControl.#sidebarReplace error - 'sidebarData.replaceId' (${
          sidebarData.replaceId}) is already in use in 'globalThis.ui'.`);
      }

      // Attempt to find the `replaceId` tab to set as the before anchor when mounting new sidebar button.
      const anchorButtonEl = data.tabsEl.querySelector(`[data-tab=${sidebarData.replaceId}]`);

      if (!(anchorButtonEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarReplace error - Could not locate sidebar tab for 'sidebarData.replaceId': ${
           sidebarData.replaceId}.`);
      }

      const sidebarTab = new FVTTSidebarTab({
         target: data.tabsEl,
         anchor: anchorButtonEl,
         props: {
            sidebarData
         }
      });

      // Remove width of the old replaced tab width.
      data.addedSidebarWidth -= styleParsePixels(globalThis.getComputedStyle(anchorButtonEl).width);

      // Get width of the tab to increase sidebar element width CSS var.
      data.addedSidebarWidth += styleParsePixels(globalThis.getComputedStyle(sidebarTab.anchorEl).width);

      // -------------------

      // Attempt to find the `replaceId` tab to set as the before anchor when mounting new sidebar.
      // At this moment the core sidebar apps are not rendered yet so are `template` and `section` elements. Also
      // Check for `section` elements in case of indexing by another Svelte sidebar added prior.
      const anchorSectionEl = data.sidebarEl.querySelector(`template[data-tab=${sidebarData.replaceId}]`) ??
       data.sidebarEl.querySelector(`section[data-tab=${sidebarData.replaceId}]`);

      if (!(anchorSectionEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarReplace error - Could not locate sidebar for 'sidebarData.replaceId': ${
           sidebarData.replaceId}.`);
      }

      // Note: The new sidebar tab section is added at the end of the `section` elements and this is fine.
      const sidebarWrapper = new FVTTSidebarWrapper({
         target: data.sidebarEl,
         anchor: anchorSectionEl,
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
      globalThis.ui[`${sidebarData.replaceId}`] = {
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

      // Remove old sidebar tab / panel.
      anchorButtonEl.remove();
      anchorSectionEl.remove();

      this.#sidebars.set(sidebarData.replaceId, sidebarEntry);
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

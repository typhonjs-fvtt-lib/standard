import { SvelteApplication }     from '#runtime/svelte/application';

import { parseTJSSvelteConfig }  from '#runtime/svelte/util';
import { ManagedPromise }        from '#runtime/util/async';
import { StyleParse }            from '#runtime/util/browser';

import {
   hasPrototype,
   isObject }                    from '#runtime/util/object';

import {
   FVTTSidebarPopout,
   FVTTSidebarTab,
   FVTTSidebarWrapper }          from '#standard/component/fvtt';

/**
 * Provides the ability to mount and control Svelte component based sidebar panels & tabs in the Foundry sidebar.
 *
 * The nice aspect about FVTTSidebarControl is that all you have to provide is the sidebar component and the rest is
 * handled for you including automatically widening the width of the sidebar to fit the new sidebar tab. Also by default
 * an adhoc SvelteApplication is configured to display the sidebar when popped out automatically without the need to
 * associate an app instance.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * To add a new sidebar tab schedule one or more invocations of {@link FVTTSidebarControl.add} in a `setup` hook. You
 * must add all sidebars in the `setup` hook before the main Foundry sidebar renders. Please review all the expanded
 * options available in the configuration object passed to the `add` method. At minimum, you need to provide a unique
 * `id`, `icon`, and `svelte` configuration object. You almost always will want to provide `beforeId` referencing
 * another existing sidebar tab ID to place the tab button before. If undefined the tab is inserted at the end of
 * the sidebar tabs. The default Foundry sidebar tab IDs from left to right are: 'chat', 'combat', 'scenes', 'actors',
 * 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
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
 * an `id` field that must be one of the existing Foundry sidebar IDs to remove: chat', 'combat', 'scenes',
 * 'actors', 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * There is a method to replace an existing stock Foundry sidebar {@link FVTTSidebarControl.replace}. It takes
 * the same data as the `add` method, but `id` must be one of the existing Foundry sidebar IDs to replace: chat',
 * 'combat', 'scenes', 'actors', 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
 *
 * Both the `add` and `replace` methods have a data field `mergeAppImpl` that provides the base implementation for the
 * added / replaced object instance assigned to `globalThis.ui.<SIDEBAR APP ID>`. When replacing Foundry core sidebar
 * panels like the {@link CombatTracker} there is additional API that you must handle found in the given core
 * sidebar app implementation. It is recommended that you implement this API as part of the control / model code passed
 * to the Svelte sidebar component and also set to `mergeAppImpl`.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * The {@link FVTTSidebarControl.get} method allows you to retrieve the associated {@link FVTTSidebarEntry} for a given
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
 *       beforeId: 'items',               // Place new tab before the 'items' tab.
 *       id: 'test',                      // A unique CSS ID.
 *       icon: 'fas fa-dice-d10',         // FontAwesome icon.
 *       condition: () => game.user.isGM, // Optional boolean / function to conditionally run the sidebar action.
 *       title: 'Test Directory',         // Title of popout sidebar app; can be language string.
 *       tooltip: 'Tests',                // Tooltip for sidebar tab.
 *       svelte: {                        // A Svelte configuration object.
 *          class: TestTab                // A Svelte component.
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
    * @type {Map<string, FVTTSidebarEntry>}
    */
   static #sidebars = new Map();

   /**
    * Adds a new Svelte powered sidebar tab / panel.
    *
    * @param {FVTTSidebarAddData}   sidebarData - The configuration object for a Svelte sidebar,
    */
   static add(sidebarData)
   {
      try
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

         if (sidebarData.condition !== void 0 && typeof sidebarData.condition !== 'boolean' &&
          typeof sidebarData.condition !== 'function')
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.condition' is not a boolean or function.`);
         }

         if (sidebarData.mergeAppImpl !== void 0 && !isObject(sidebarData.mergeAppImpl))
         {
            throw new TypeError(`FVTTSidebarControl.add error: 'sidebarData.mergeAppImpl' is not an object.`);
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
            svelteConfig = parseTJSSvelteConfig(sidebarData.svelte);
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
               iconSvelteConfig = parseTJSSvelteConfig(sidebarData.icon);
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
      catch (err)
      {
         console.error(err);
      }
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
         initialSidebarWidth: StyleParse.pixels(globalThis?.getComputedStyle(sidebarEl)?.width),
         addedSidebarWidth: 0
      };

      for (const sidebarData of this.#initData)
      {
         // Handle optional `condition` field potentially skipping the current sidebar action.
         if (sidebarData.condition !== void 0)
         {
            if (typeof sidebarData.condition === 'boolean' && !sidebarData.condition) { continue; }
            else if (typeof sidebarData.condition === 'function' && !sidebarData.condition()) { continue; }
         }

         try
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
         catch (err)
         {
            console.error(err);
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
    * @returns {FVTTSidebarEntry} The sidebar entry.
    */
   static get(id)
   {
      return this.#sidebars.get(id);
   }

   /**
    * Removes an existing sidebar tab / panel.
    *
    * @param {FVTTSidebarRemoveData}   sidebarData - The configuration object to remove a Svelte sidebar.
    */
   static remove(sidebarData)
   {
      try
      {
         if (!isObject(sidebarData))
         {
            throw new TypeError(`FVTTSidebarControl.remove error: 'sidebarData' is not an object.`);
         }

         if (typeof sidebarData.id !== 'string')
         {
            throw new TypeError(`FVTTSidebarControl.remove error: 'sidebarData.id' is not a string.`);
         }

         if (sidebarData.condition !== void 0 && typeof sidebarData.condition !== 'boolean' &&
          typeof sidebarData.condition !== 'function')
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.condition' is not a boolean or function.`);
         }

         // Verify that there is an entry for `sidebarData.id` defined in 'CONFIG.ui` indicating that the ID
         // is available to remove.
         if (CONFIG.ui[sidebarData.id] === void 0)
         {
            throw new Error(`FVTTSidebarControl.remove error - 'sidebarData.id' (${
             sidebarData.id}) not found in 'CONFIG.ui'.`);
         }

         // Remove existing Application reference for `sidebarData.id`.
         // delete CONFIG.ui[sidebarData.id];

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
      catch (err)
      {
         console.error(err);
      }
   }

   /**
    * Replaces an existing sidebar tab / panel with a new Svelte powered sidebar.
    *
    * @param {FVTTSidebarReplaceData}   sidebarData - The configuration object to replace a core sidebar with a Svelte
    *        sidebar.
    */
   static replace(sidebarData)
   {
      try
      {
         if (!isObject(sidebarData))
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData' is not an object.`);
         }

         if (typeof sidebarData.icon !== 'string' && !isObject(sidebarData.icon))
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.icon' is not a string or object.`);
         }

         if (typeof sidebarData.id !== 'string')
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.id' is not a string.`);
         }

         if (sidebarData.condition !== void 0 && typeof sidebarData.condition !== 'boolean' &&
          typeof sidebarData.condition !== 'function')
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.condition' is not a boolean or function.`);
         }

         if (sidebarData.mergeAppImpl !== void 0 && !isObject(sidebarData.mergeAppImpl))
         {
            throw new TypeError(`FVTTSidebarControl.replace error: 'sidebarData.mergeAppImpl' is not an object.`);
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

         // Verify that there is an entry for `sidebarData.id` defined in 'CONFIG.ui` indicating that the ID
         // is available to replace.
         if (CONFIG.ui[sidebarData.id] === void 0)
         {
            throw new Error(`FVTTSidebarControl.replace error - 'sidebarData.id' (${
             sidebarData.id}) not found in 'CONFIG.ui'.`);
         }

         let svelteConfig;

         try
         {
            svelteConfig = parseTJSSvelteConfig(sidebarData.svelte);
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
               iconSvelteConfig = parseTJSSvelteConfig(sidebarData.icon);
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
      catch (err)
      {
         console.error(err);
      }
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
      data.addedSidebarWidth += StyleParse.pixels(globalThis.getComputedStyle(sidebarTab.anchorEl).width);

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

      /** @type {FVTTSidebarEntry} */
      const sidebarEntry = {
         data: sidebarData,
         popout: sidebarData.popoutApplication !== void 0 ? new sidebarData.popoutApplication() :
          new SvelteApplication(sidebarData.popoutOptions),
         tab: sidebarTab,
         wrapper: sidebarWrapper
      };

      Object.freeze(sidebarEntry);

      // Fake the bare minimum API necessary for a Foundry sidebar tab which is added to `globalThis.ui`.
      globalThis.ui[`${sidebarData.id}`] = Object.assign(sidebarData.mergeAppImpl ?? {}, {
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
      });

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
      // Remove specific sidebar app from Foundry core Sidebar class. This prevents rendering of that sidebar and
      // must be removed here after the `condition` check in #initialize.
      delete globalThis.ui?.sidebar?.tabs[sidebarData.id];

      // Attempt to find the `id` tab to set as the before anchor when mounting new sidebar button.
      const anchorButtonEl = data.tabsEl.querySelector(`[data-tab=${sidebarData.id}]`);

      if (!(anchorButtonEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarRemove error - Could not locate sidebar tab for 'sidebarData.id': ${
           sidebarData.id}.`);
      }

      // Remove width of the old replaced tab width.
      data.addedSidebarWidth -= StyleParse.pixels(globalThis.getComputedStyle(anchorButtonEl).width);

      // -------------------

      // Attempt to find the existing `id` panel.
      const anchorSectionEl = data.sidebarEl.querySelector(`template[data-tab=${sidebarData.id}]`) ??
       data.sidebarEl.querySelector(`section[data-tab=${sidebarData.id}]`);

      if (!(anchorSectionEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarRemove error - Could not locate sidebar for 'sidebarData.id': ${
           sidebarData.id}.`);
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
      // Remove specific sidebar app from Foundry core Sidebar class. This prevents rendering of that sidebar and
      // must be removed here after the `condition` check in #initialize.
      delete globalThis.ui?.sidebar?.tabs[sidebarData.id];

      // Attempt to find the `id` tab to set as the before anchor when mounting new sidebar button.
      const anchorButtonEl = data.tabsEl.querySelector(`[data-tab=${sidebarData.id}]`);

      if (!(anchorButtonEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarReplace error - Could not locate sidebar tab for 'sidebarData.id': ${
           sidebarData.id}.`);
      }

      const sidebarTab = new FVTTSidebarTab({
         target: data.tabsEl,
         anchor: anchorButtonEl,
         props: {
            sidebarData
         }
      });

      // Remove width of the old replaced tab width.
      data.addedSidebarWidth -= StyleParse.pixels(globalThis.getComputedStyle(anchorButtonEl).width);

      // Get width of the tab to increase sidebar element width CSS var.
      data.addedSidebarWidth += StyleParse.pixels(globalThis.getComputedStyle(sidebarTab.anchorEl).width);

      // -------------------

      // Attempt to find the `id` tab to set as the before anchor when mounting new sidebar.
      // At this moment the core sidebar apps are not rendered yet so are `template` and `section` elements. Also
      // Check for `section` elements in case of indexing by another Svelte sidebar added prior.
      const anchorSectionEl = data.sidebarEl.querySelector(`template[data-tab=${sidebarData.id}]`) ??
       data.sidebarEl.querySelector(`section[data-tab=${sidebarData.id}]`);

      if (!(anchorSectionEl instanceof HTMLElement))
      {
         throw new TypeError(
          `FVTTSidebarControl.#sidebarReplace error - Could not locate sidebar for 'sidebarData.id': ${
           sidebarData.id}.`);
      }

      // Note: The new sidebar tab section is added at the end of the `section` elements and this is fine.
      const sidebarWrapper = new FVTTSidebarWrapper({
         target: data.sidebarEl,
         anchor: anchorSectionEl,
         props: {
            sidebarData
         }
      });

      /** @type {FVTTSidebarEntry} */
      const sidebarEntry = {
         data: sidebarData,
         popout: sidebarData.popoutApplication !== void 0 ? new sidebarData.popoutApplication() :
          new SvelteApplication(sidebarData.popoutOptions),
         tab: sidebarTab,
         wrapper: sidebarWrapper
      };

      Object.freeze(sidebarEntry);

      // Fake the bare minimum API necessary for a Foundry sidebar tab which is added to `globalThis.ui`.
      globalThis.ui[`${sidebarData.id}`] = Object.assign(sidebarData.mergeAppImpl ?? {}, {
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
      });

      // Remove old sidebar tab / panel.
      anchorButtonEl.remove();
      anchorSectionEl.remove();

      this.#sidebars.set(sidebarData.id, sidebarEntry);
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
 * @typedef {object} FVTTSidebarAddData The configuration object to add a Svelte sidebar.
 *
 * @property {string}   id The unique Sidebar ID / name. Used for CSS ID and retrieving the sidebar.
 *
 * @property {string|import('#runtime/svelte/util').TJSSvelteConfig}  icon The FontAwesome icon css classes
 * _or_ a Svelte configuration object to load a custom Svelte component to use as the "icon".
 *
 * @property {import('#runtime/svelte/util').TJSSvelteConfig}   svelte A Svelte configuration object.
 *
 * @property {string}   [beforeId] The ID for the tab to place the new sidebar before. This must be an
 * existing sidebar tab ID. THe stock Foundry sidebar tab IDs from left to right are:
 *
 * @property {boolean | (() => boolean)}  [condition] A boolean value or function to invoke that returns a
 * boolean value to control sidebar replacement. This is executed in the `renderSidebar` callback
 * internally.
 *
 * @property {object}   [mergeAppImpl] Provides a custom base implementation for the object instance
 * for this sidebar app stored in `globalThis.ui.<SIDEBAR ID>`.
 *
 * @property {import('#runtime/svelte/application').SvelteApplication}   [popoutApplication] Provides a custom
 * SvelteApplication class to instantiate for the popout sidebar.
 *
 * @property {object}   [popoutOptions] Provides SvelteApplication options overrides for the default popout sidebar.
 *
 * @property {string}   [title] The popout application title text or i18n lang key.
 *
 * @property {string}   [tooltip] The sidebar tab tooltip text or i18n lang key.
 */

/**
 * @typedef {object} FVTTSidebarRemoveData
 *
 * @property {string}   id The ID for the sidebar tab to remove. This must be an existing sidebar tab ID.
 *
 * @property {boolean | (() => boolean)}   [condition] A boolean value or function to invoke that returns a boolean
 * value to control sidebar replacement. This is executed in the `renderSidebar` callback internally.
 */

/**
 * @typedef {object} FVTTSidebarReplaceData The configuration object to replace a core sidebar with a Svelte sidebar.
 *
 * @property {string|import('#runtime/svelte/util').TJSSvelteConfig}  icon The FontAwesome icon css classes _or_ a
 * Svelte configuration object to load a custom Svelte component to use as the "icon".
 *
 * @property {string}   id The ID for the sidebar to replace. This must be an existing sidebar tab ID.
 *
 * @property {import('#runtime/svelte/util').TJSSvelteConfig}   svelte A Svelte configuration object.
 *
 * @property {boolean | (() => boolean)}   [condition] A boolean value or function to invoke that returns a boolean
 * value to control sidebar replacement. This is executed in the `renderSidebar` callback internally.
 *
 * @property {object}   [mergeAppImpl] Provides a custom base implementation for the object instance for this sidebar
 * app stored in `globalThis.ui.<SIDEBAR ID>`.
 *
 * @property {import('#runtime/svelte/application').SvelteApplication}   [popoutApplication] Provides a custom
 * SvelteApplication class to instantiate for the popout sidebar.
 *
 * @property {object}   [popoutOptions] Provides SvelteApplication options overrides for the default popout sidebar.
 *
 * @property {string}   [title] The popout application title text or i18n lang key.
 *
 * @property {string}   [tooltip] The sidebar tab tooltip text or i18n lang key.
 */

/**
 * @typedef {object} FVTTSidebarEntry
 *
 * @property {FVTTSidebarAddData | FVTTSidebarRemoveData | FVTTSidebarReplaceData} data The sidebar data that
 * configures a Svelte sidebar.
 *
 * @property {import('#runtime/svelte/application').SvelteApplication}  popout The sidebar popout application.
 *
 * @property {import('svelte').SvelteComponent} tab The tab wrapper component.
 *
 * @property {import('svelte').SvelteComponent} wrapper The sidebar wrapper component.
 */

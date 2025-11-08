import { writable }              from 'svelte/store';

import { TJSDialog }             from '#runtime/svelte/application';
import { TJSSvelte }             from '#runtime/svelte/util';
import { localize }              from '#runtime/util/i18n';
import { isObject }              from '#runtime/util/object';

import {
   ripple,
   rippleFocus }                 from '#standard/action/animate/composable';

import type {
   Readable,
   Writable }                    from 'svelte/store';

import type { MinimalWritable }  from '#runtime/svelte/store/util';

import type {
   TJSGameSettingsWithUI }       from './TJSGameSettingsWithUI';

/**
 * Controls preparation and processing of registered game settings w/ TJSGameSettingsUI. Game settings are parsed
 * for UI display by TJSSettingsEdit. The store `showSettings` is utilized in TJSSettingsSwap component to provide
 * an easy way to flip between settings component or any main slotted component.
 */
export class UIControlImpl implements TJSGameSettingsWithUI.UIControl
{
   /**
    */
   #sections: TJSGameSettingsWithUI.Options.CustomSection[] = [];

   /**
    */
   #settings: TJSGameSettingsWithUI;

   /**
    */
   #showSettings: boolean = false;

   /**
    */
   readonly #showSettingsSet: Function;

   /**
    */
   readonly #stores: { showSettings: Readable<boolean> };

   /**
    * @param settings -
    */
   constructor(settings: TJSGameSettingsWithUI)
   {
      this.#settings = settings;

      const showSettings: Writable<boolean> = writable(this.#showSettings);
      this.#showSettingsSet = showSettings.set;

      this.#stores = {
         showSettings: { subscribe: showSettings.subscribe }
      };

      Object.freeze(this.#stores);
   }

   /**
    * @returns Current `showSettings` state.
    */
   get showSettings(): boolean
   {
      return this.#showSettings;
   }

   /**
    * @returns Returns the managed stores.
    */
   get stores(): { showSettings: Readable<boolean> }
   {
      return this.#stores;
   }

   /**
    * Sets current `showSettings` state.
    *
    * @param showSettings - New `showSettings` state.
    */
   set showSettings(showSettings: boolean)
   {
      if (typeof showSettings !== 'boolean') { throw new TypeError('showSettings must be a boolean'); }

      this.#showSettings = showSettings;
      this.#showSettingsSet(this.#showSettings);
   }

   /**
    * Adds a custom section / folder defined by the provided TJSSettingsCustomSection options object.
    *
    * @param options - The configuration object for the custom section.
    */
   addSection(options: TJSGameSettingsWithUI.Options.CustomSection): void
   {
      if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }

      if (!TJSSvelte.util.isComponent(options.class))
      {
         throw new TypeError(`'options.class' is not a Svelte component.`);
      }

      if (options.props !== void 0 && !isObject(options.props))
      {
         throw new TypeError(`'options.props' is not an object.`);
      }

      if (options.folder !== void 0)
      {
         const folder: string | TJSGameSettingsWithUI.Options.CustomSectionFolder = options.folder;

         if (typeof folder !== 'string' && !isObject(folder))
         {
            throw new TypeError(`'options.folder' is not a string or object.`);
         }

         if (isObject(folder))
         {
            if (typeof folder.label !== 'string') { throw new TypeError(`'options.folder.label' is not a string.`); }

            // Validate custom component set as folder summary end.
            if (folder.summaryEnd !== void 0)
            {
               if (!isObject(folder.summaryEnd))
               {
                  throw new TypeError(`'options.folder.summaryEnd' is not an object.`);
               }

               if (!TJSSvelte.util.isComponent(folder.summaryEnd.class))
               {
                  throw new TypeError(`'options.folder.summaryEnd.class' is not a Svelte component.`);
               }

               if (folder.summaryEnd.props !== void 0 && !isObject(folder.summaryEnd.props))
               {
                  throw new TypeError(`'options.folder.summaryEnd.props' is not an object.`);
               }
            }

            // Validate that folder inline styles is an object.
            if (folder.styles !== void 0 && !isObject(folder.styles))
            {
               throw new TypeError(`'options.folder.styles' is not an object.`);
            }
         }
      }

      // Validate that section inline styles is an object.
      if (options.styles !== void 0 && !isObject(options.styles))
      {
         throw new TypeError(`'options.styles' is not an object.`);
      }

      this.#sections.push(options);
   }

   /**
    * Creates the `TJSSettingsUI.Data` object by parsing stored settings in the associated {@link TJSGameSettings}
    * instance.
    *
    * @param [options] - Create options
    *
    * @returns Parsed UI settings data.
    */
   create(options?: TJSGameSettingsWithUI.Options.Create): TJSGameSettingsWithUI.Data
   {
      const settings: TJSGameSettingsWithUI.Data = this.#parseSettings(options);
      const destroy: Function = (): void => this.#destroy(settings);

      return {
         ...settings,
         destroy
      };
   }

   /**
    * Destroy callback. Checks for any `requiresReload` parameter in each setting comparing against initial value
    * when `settings` is created and current value. If there is a difference then show a modal dialog asking the user
    * if they want to reload for those settings to take effect.
    *
    * @param settings - The UI data object initiated w/ `create`.
    */
   #destroy(settings: TJSGameSettingsWithUI.Data): void
   {
      let requiresClientReload: boolean | undefined = false;
      let requiresWorldReload: boolean | undefined = false;

      if (Array.isArray(settings.topLevel))
      {
         for (const setting of settings.topLevel)
         {
            const current: unknown = globalThis.game.settings.get(setting.namespace, setting.key);
            if (current === setting.initialValue) { continue; }

            requiresClientReload ||= (setting.scope === 'client') && setting.requiresReload;
            requiresWorldReload ||= (setting.scope === 'world') && setting.requiresReload;
         }
      }

      if (Array.isArray(settings.folders))
      {
         for (const folder of settings.folders)
         {
            if (Array.isArray(folder.settings))
            {
               for (const setting of folder.settings)
               {
                  const current = globalThis.game.settings.get(setting.namespace, setting.key);
                  if (current === setting.initialValue) { continue; }

                  requiresClientReload ||= (setting.scope === 'client') && setting.requiresReload;
                  requiresWorldReload ||= (setting.scope === 'world') && setting.requiresReload;
               }
            }
         }
      }

      if (requiresClientReload || requiresWorldReload) { this.#reloadConfirm({ world: requiresWorldReload }); }

      this.#showSettings = false;
      this.#showSettingsSet(this.#showSettings);
   }

   /**
    * @param [options] - Optional parameters.
    *
    * @returns Parsed UI settings data.
    */
   #parseSettings({ efx, storage }: TJSGameSettingsWithUI.Options.Create = {}): TJSGameSettingsWithUI.Data
   {
      const namespace: string = this.#settings.namespace;

      if (storage && typeof namespace !== 'string')
      {
         console.warn(
          `TJSGameSettings warning: 'options.storage' defined, but 'namespace' not defined in TJSGameSettings.`);
      }

      const hasStorage: boolean = storage !== void 0 && typeof namespace === 'string';

      const uiSettings: TJSGameSettingsWithUI.UISetting.Data[] = [];

      const canConfigure: boolean = globalThis.game.user.can('SETTINGS_MODIFY');
      const isUserGM: boolean = globalThis.game.user.isGM;

      for (const setting of this.#settings.data())
      {
         if (!isObject(setting.options)) { continue; }

         // If `configApp` is not defined defer to core options `config` value.
         const includeSetting = typeof setting.configApp === 'boolean' ? setting.configApp : setting.options.config;

         if (!includeSetting || (!canConfigure && setting.options.scope === 'world') ||
          (setting.options.restricted && !isUserGM))
         {
            continue;
         }

         let options: { value: string, label: string }[] | undefined;

         if (isObject(setting.options.choices))
         {
            options = Object.entries(setting.options.choices).map((entry: [string, string]):
             { value: string, label: string } => ({ value: entry[0], label: localize(entry[1]) }));
         }

         let range: { min: number, max: number, step: number } | undefined;
         if (isObject(setting.options.range))
         {
            // Verify range data.
            if (typeof setting.options.range.min !== 'number')
            {
               throw new TypeError(`Setting 'options.range.min' is not a number.`);
            }

            if (typeof setting.options.range.max !== 'number')
            {
               throw new TypeError(`Setting 'options.range.max' is not a number.`);
            }

            if (setting.options.range.step !== void 0 && typeof setting.options.range.step !== 'number')
            {
               throw new TypeError(`Setting 'options.range.step' is not a number.`);
            }

            range = {
               min: setting.options.range.min,
               max: setting.options.range.max,
               step: setting.options.range.step ?? 1
            };
         }

         // Default to `String` if no type is provided.
         const type: string = typeof setting.options.type === 'function' ? setting.options.type.name : 'String';

         // Only configure file picker if setting type is a string.
         let filePicker: string | undefined;
         if (type === 'String')
         {
            switch (typeof setting.options.filePicker)
            {
               case 'boolean':
                  filePicker = setting.options.filePicker ? 'any' : void 0;
                  break;

               case 'string':
                  filePicker = setting.options.filePicker;
                  break;
            }
         }

         let buttonData: TJSGameSettingsWithUI.UISetting.ButtonData | undefined;
         if (filePicker)
         {
            buttonData = {
               icon: 'fas fa-file-import fa-fw',
               efx: efx === 'ripple' ? ripple() : void 0,
               tooltip: 'FILES.BrowseTooltip',
               styles: { 'margin-left': '0.25em' }
            };
         }

         const store: MinimalWritable<unknown> = this.#settings.getStore(setting.key)!;

         let inputData: TJSGameSettingsWithUI.UISetting.InputData | undefined;
         let selectData: TJSGameSettingsWithUI.UISetting.SelectData | undefined;

         let componentType: string = 'text';

         if (setting.options.type === Boolean)
         {
            componentType = 'checkbox';
         }
         else if (options !== void 0)
         {
            componentType = 'select';

            selectData = {
               store,
               efx: efx === 'ripple' ? rippleFocus() : void 0,
               type: componentType,
               options
            };
         }
         else if (setting.options.type === Number)
         {
            componentType = isObject(setting.options.range) ? 'range-number' : 'number';
         }

         if (componentType === 'text' || componentType === 'number')
         {
            inputData = {
               store,
               efx: efx === 'ripple' ? rippleFocus() : void 0,
               type: componentType
            };
         }
         else if (componentType === 'range-number')
         {
            inputData = {
               store,
               efxNumber: efx === 'ripple' ? rippleFocus() : void 0,
               readonly: true,
               type: componentType,
               ...setting.options.range
            };
         }

         uiSettings.push({
            id: `${setting.namespace}.${setting.key}`,
            namespace: setting.namespace,
            folder: setting.folder,
            key: setting.key,
            name: localize(setting.options?.name ?? ''),
            hint: localize(setting.options?.hint ?? ''),
            type,
            componentType,
            filePicker,
            range,
            store,
            initialValue: globalThis.game.settings.get(setting.namespace, setting.key),
            scope: setting.options.scope,
            requiresReload: typeof setting.options.requiresReload === 'boolean' ? setting.options.requiresReload :
             false,
            buttonData,
            inputData,
            selectData
         });
      }

      // If storage is available then create a key otherwise create a dummy store, so `applyScroll` works.
      const storeScrollbar: Writable<number> = hasStorage && storage ?
       storage.getStore(`${namespace}-settings-scrollbar`) : writable(0);

      const topLevel: TJSGameSettingsWithUI.UISetting.Data[] = [];

      const folderData: { [key: string]: TJSGameSettingsWithUI.UISetting.Data[] } = {};

      // Sort into folders
      for (const setting of uiSettings)
      {
         if (typeof setting.folder === 'string')
         {
            const folderName: string = localize(setting.folder);

            // Create folder array if one doesn't exist already.
            if (!Array.isArray(folderData[folderName])) { folderData[folderName] = []; }
            folderData[folderName].push(setting);
         }
         else // Add to 'toplevel' settings
         {
            topLevel.push(setting);
         }
      }

      // Convert folderData object to array.
      const folders: TJSGameSettingsWithUI.Data.Folder[] = Object.entries(folderData).map(
       (entry: [string, TJSGameSettingsWithUI.UISetting.Data[]]): TJSGameSettingsWithUI.Data.Folder =>
      {
         return {
            label: entry[0],
            store: hasStorage && storage ? storage.getStore(`${namespace}-settings-folder-${entry[0]}`) : void 0,
            settings: entry[1],
         };
      });

      const sections: TJSGameSettingsWithUI.Data.Section[] = [];

      // Parse custom component sections
      for (const section of this.#sections)
      {
         const parsedSection: TJSGameSettingsWithUI.Data.Section = {
            class: section.class,
            props: section.props,
            styles: section.styles
         };

         if (typeof section.folder === 'string')
         {
            const label = localize(section.folder);

            parsedSection.folder = {
               label,
               store: hasStorage && storage ? storage.getStore(`${namespace}-settings-folder-${label}`) : void 0
            };
         }
         else if (isObject(section.folder))
         {
            const label = localize(section.folder.label);

            parsedSection.folder = {
               label,
               store: hasStorage && storage ? storage.getStore(`${namespace}-settings-folder-${label}`) : void 0,
               summaryEnd: section.folder.summaryEnd,
               styles: section.folder.styles
            };
         }

         sections.push(parsedSection);
      }

      return {
         storeScrollbar,
         topLevel,
         folders,
         sections
      };
   }

   async #reloadConfirm({ world = false } = {})
   {
      let title = localize('SETTINGS.ReloadPromptTitle');
      let label = localize('SETTINGS.ReloadPromptBody');

      // Foundry v9 doesn't have the reload lang keys, so substitute just for English translation.
      // TODO: FOUNDRY_V9 - remove when support for v9 is dropped.
      title = title !== 'SETTINGS.ReloadPromptTitle' ? title : 'Reload Application?';
      label = label !== 'SETTINGS.ReloadPromptBody' ? label :
       'Some of the changed settings require a reload of the application to take effect. Would you like to reload now?';

      const reload = await TJSDialog.confirm({
         modal: true,
         draggable: false,
         title,
         content: `<p>${label}</p>`
      });

      if (!reload) { return; }

      // Reload all connected clients. Note: Foundry v9 might not support this event.
      if (world && globalThis.game.user.isGM) { globalThis.game.socket.emit('reload'); }

      // Reload locally.
      window.location.reload();
   }

   /**
    * Convenience method to swap `showSettings`.
    *
    * @returns {boolean} New `showSettings` state.
    */
   swapShowSettings()
   {
      this.#showSettings = !this.#showSettings;
      this.#showSettingsSet(this.#showSettings);
      return this.#showSettings;
   }
}

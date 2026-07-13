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

      const destroy: TJSGameSettingsWithUI.Data['destroy'] = (): void => this.#destroy(settings);

      const resetCurrent: TJSGameSettingsWithUI.Data['resetCurrent'] =
       (options): Promise<boolean> => this.#resetCurrent(settings, options);

      const resetDefault: TJSGameSettingsWithUI.Data['resetDefault'] =
       (options): Promise<boolean> => this.#resetDefault(settings, options);

      return {
         ...settings,
         destroy,
         resetCurrent,
         resetDefault
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
      const { requiresUserReload, requiresWorldReload } = this.#requireReload(settings.allSettings)

      if (requiresUserReload || requiresWorldReload) { this.#reloadConfirm({ world: requiresWorldReload }); }

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

      const canConfigure: boolean = game.user.can('SETTINGS_MODIFY');
      const isUserGM: boolean = game.user.isGM;

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

         // Skip DataModel class / instances.
         if (foundry.utils.isSubclass(setting.options.type, foundry.abstract.DataModel) ||
          setting.options.type instanceof foundry.abstract.DataModel)
         {
            console.warn(`[TRL] TJSGameSettingsWithUI warning: skipping key '${
             setting.key}' as DataModel classes are not supported.`);

            continue;
         }

         const id = `${setting.namespace}.${setting.key}`;

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
         let type: string = 'String';

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

         const defaultValue = setting.options.default;
         const initialValue = game.settings.get(setting.namespace, setting.key);

         let inputData: TJSGameSettingsWithUI.UISetting.InputData | undefined;
         let selectData: TJSGameSettingsWithUI.UISetting.SelectData | undefined;

         let datafield: fvtt.DataField | undefined;

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
         else if (setting.options.type instanceof foundry.data.fields.DataField)
         {
            try
            {
               datafield = setting.options.type;
            }
            catch (err: unknown)
            {
               console.error((err as Error).message);
               continue;
            }
         }

         if (componentType === 'text' || componentType === 'number')
         {
            inputData = {
               store,
               efx: efx === 'ripple' ? rippleFocus() : void 0,
               type: componentType
            };

            if (typeof setting.readonly === 'boolean' && setting.readonly)
            {
               inputData.readonly = setting.readonly;
            }
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
            id,
            namespace: setting.namespace,
            folder: setting.folder,
            key: setting.key,
            groupConfig: {
               label: localize(setting.options?.name ?? ''),
               hint: localize(setting.options?.hint ?? ''),
               units: localize(setting.options?.units ?? '')
            },
            type,
            store,
            defaultValue,
            initialValue,
            scope: setting.options.scope,
            requiresReload: typeof setting.options.requiresReload === 'boolean' ? setting.options.requiresReload :
             false,
            datafield,
            componentType,
            filePicker,
            range,
            buttonData,
            inputData,
            selectData,
         });
      }

      // If storage is available then create a key otherwise create a dummy store, so `applyScroll` works.
      const storeScrollbar: Writable<number> = hasStorage && storage ?
       storage.getStore(`${namespace}-settings-scrollbar`, 0) : writable(0);

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
            store: hasStorage && storage ? storage.getStore(`${namespace}-settings-folder-${entry[0]}`, false) : void 0,
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
               store: hasStorage && storage ?
                storage.getStore(`${namespace}-settings-folder-${section.folder}`, false) : void 0
            };
         }
         else if (isObject(section.folder))
         {
            const label = localize(section.folder.label);

            parsedSection.folder = {
               label,
               store: hasStorage && storage ?
                storage.getStore(`${namespace}-settings-folder-${section.folder.label}`, false) : void 0,
               summaryEnd: section.folder.summaryEnd,
               styles: section.folder.styles
            };
         }

         sections.push(parsedSection);
      }

      return {
         allSettings: uiSettings,
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
      if (world && game.user.isGM) { game.socket.emit('reload'); }

      // Reload locally.
      window.location.reload();
   }

   /**
    * Checks given UISetting data if any of the given settings require a reload of Foundry.
    *
    * @param settingData - Settings to verify.
    *
    * @returns Object containing `requiresUserReload` / `requiresWorldReload`.
    */
   #requireReload(settingData: TJSGameSettingsWithUI.UISetting.Data[]):
    { requiresUserReload: boolean, requiresWorldReload: boolean }
   {
      let requiresUserReload: boolean | undefined = false;
      let requiresWorldReload: boolean | undefined = false;

      for (const setting of settingData)
      {
         if (!setting.requiresReload) { continue; }

         const current: unknown = game.settings.get(setting.namespace, setting.key);
         if (current === setting.initialValue) { continue; }

         requiresUserReload ||= (setting.scope === 'client' || setting.scope === 'user');
         requiresWorldReload ||= (setting.scope === 'world');
      }

      return { requiresUserReload, requiresWorldReload };
   }

   /**
    * Resets any current changes made to settings since the UIControl data has been initialized.
    */
   async #resetCurrent(settings: TJSGameSettingsWithUI.Data, { confirm = false }): Promise<boolean>
   {
      if (confirm)
      {
         let title = localize('TYPHONJS.TJSGameSettingsUI.resetCurrent.title');
         let label = localize('TYPHONJS.TJSGameSettingsUI.resetCurrent.label');

         title = title !== 'TYPHONJS.TJSGameSettingsUI.resetCurrent.title' ? title : 'Reset Current Changes?';
         label = label !== 'TYPHONJS.TJSGameSettingsUI.resetCurrent.label' ? label :
          'Reset current changes since the game settings panel has been activated?';

         const reset = await TJSDialog.confirm({
            modal: true,
            draggable: false,
            title,
            content: `<p>${label}</p>`
         });

         if (!reset) { return false; }
      }

      for (const setting of settings.allSettings) { setting.store.set(setting.initialValue); }

      return true;
   }

   /**
    * Resets all settings to initial default values.
    */
   async #resetDefault(settings: TJSGameSettingsWithUI.Data, { confirm = false }): Promise<boolean>
   {
      if (confirm)
      {
         let title = localize('TYPHONJS.TJSGameSettingsUI.resetDefault.title');
         let label = localize('TYPHONJS.TJSGameSettingsUI.resetDefault.label');

         title = title !== 'TYPHONJS.TJSGameSettingsUI.resetDefault.title' ? title : 'Reset Defaults?';
         label = label !== 'TYPHONJS.TJSGameSettingsUI.resetDefault.label' ? label :
          'Reset all settings to default values?';

         const reset = await TJSDialog.confirm({
            modal: true,
            draggable: false,
            title,
            content: `<p>${label}</p>`
         });

         if (!reset) { return false; }
      }

      for (const setting of settings.allSettings) { setting.store.set(setting.defaultValue); }

      return true;
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

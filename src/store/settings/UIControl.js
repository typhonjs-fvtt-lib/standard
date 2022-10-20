import { writable }  from 'svelte/store';

import { TJSDialog } from '@typhonjs-fvtt/svelte/application';

import { localize }  from '@typhonjs-fvtt/svelte/helper'

import {
   ripple,
   rippleFocus }     from '@typhonjs-fvtt/svelte-standard/action';

export class UIControl
{
   /** @type {TJSGameSettings} */
   #settings;

   #showSettings = false;
   #showSettingsSet;

   #stores;

   /**
    * @param {TJSGameSettings}   settings -
    */
   constructor(settings)
   {
      this.#settings = settings;

      const showSettings = writable(this.#showSettings);
      this.#showSettingsSet = showSettings.set;

      this.#stores = {
         showSettings: { subscribe: showSettings.subscribe }
      };

      Object.freeze(this.#stores);
   }

   get showSettings()
   {
      return this.#showSettings;
   }

   get stores()
   {
      return this.#stores;
   }

   set showSettings(showSettings)
   {
      this.#showSettings = showSettings;
      this.#showSettingsSet(this.#showSettings);
   }

   /**
    * Creates a
    * @returns {{folders: {settings: *, name: *}[], topLevel: [], destroy: (function(): void)}}
    */
   create()
   {
      const settings = this.#parseSettings();
      const destroy = () => this.#destroy(settings);

      return {
         ...settings,
         destroy
      };
   }

   /**
    * Callback
    *
    * @param {object}   settings
    */
   #destroy(settings)
   {
      let requiresClientReload = false;
      let requiresWorldReload = false;

      if (Array.isArray(settings.topLevel))
      {
         for (const setting of settings.topLevel)
         {
            const current = game.settings.get(setting.namespace, setting.key);
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
                  const current = game.settings.get(setting.namespace, setting.key);
                  if (current === setting.initialValue) { continue; }

                  requiresClientReload ||= (setting.scope === 'client') && setting.requiresReload;
                  requiresWorldReload ||= (setting.scope === 'world') && setting.requiresReload;
               }
            }
         }
      }

      if ( requiresClientReload || requiresWorldReload ) { this.#reloadConfirm({ world: requiresWorldReload }); }

      this.#showSettings = false;
      this.#showSettingsSet(this.#showSettings);
   }

   async #reloadConfirm({ world = false } = {})
   {
      let title = game.i18n.localize('SETTINGS.ReloadPromptTitle');
      let label = game.i18n.localize('SETTINGS.ReloadPromptBody');

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
      if ( world && game.user.isGM ) { game.socket.emit('reload'); }

      // Reload locally.
      window.location.reload();
   }

   swapShowSettings()
   {
      this.#showSettings = !this.#showSettings;
      this.#showSettingsSet(this.#showSettings);
      return this.#showSettings;
   }

   #parseSettings()
   {
      const uiSettings = [];

      const canConfigure = game.user.can('SETTINGS_MODIFY');

      for (const setting of this.#settings)
      {
         if (!setting.config || (!canConfigure && (setting.scope !== 'client'))) { continue; }

         let options;

         if (typeof setting.choices === 'object')
         {
            options = Object.entries(setting.choices).map((entry) => ({ value: entry[0], label: localize(entry[1]) }));
         }

         let range;
         if (typeof setting.range === 'object')
         {
            range = {};

            // TODO Better error messages.
            // Verify range data.
            if (typeof setting.range.min !== 'number') { throw new TypeError(`Setting 'range.min' is not a number.`); }
            if (typeof setting.range.max !== 'number') { throw new TypeError(`Setting 'range.max' is not a number.`); }
            if (setting.range.step !== void 0 && typeof setting.range.step !== 'number')
            {
               throw new TypeError(`Setting 'range.step' is not a number.`);
            }

            range.min = setting.range.min;
            range.max = setting.range.max;
            range.step = setting.range.step ? setting.range.step : 1;
         }

         // Default to `String` if no type is provided.
         let type = setting.type instanceof Function ? setting.type.name : 'String';

         // Only configure file picker if setting type is a string.
         let filePicker;
         if (type === 'String')
         {
            filePicker = setting.filePicker === true ? 'any' : setting.filePicker;
         }

         let buttonData;
         if (filePicker)
         {
            buttonData = {
               icon: 'fas fa-file-import fa-fw',
               efx: ripple(),
               title: 'FILES.BrowseTooltip',
               styles: { 'margin-left': '0.25em'}
            };
         }

         const store = this.#settings.getStore(setting.key);

         let selectData;

         /** @type {string} */
         let componentType = 'text';

         if (setting.type === Boolean)
         {
            componentType = 'checkbox';
         }
         else if (options !== void 0)
         {
            componentType = 'select';

            selectData = {
               store,
               efx: rippleFocus(),
               type: componentType,
               options
            }
         }
         else if (setting.type === Number)
         {
            componentType = typeof setting.range === 'object' ? 'range' : 'number'
         }

         let inputData;
         if (componentType === 'text' || componentType === 'number')
         {
            inputData = {
               store,
               efx: rippleFocus(),
               type: componentType
            };
         }

         uiSettings.push({
            id: `${setting.namespace}.${setting.key}`,
            namespace: setting.namespace,
            folder: setting.folder,
            key: setting.key,
            name: localize(setting.name),
            hint: localize(setting.hint),
            type,
            componentType,
            filePicker,
            range,
            store,
            initialValue: game.settings.get(setting.namespace, setting.key),
            scope: setting.scope,
            requiresReload: typeof setting.requiresReload === 'boolean' ? setting.requiresReload : false,
            buttonData,
            inputData,
            selectData
         });
      }

      const topLevel = [];

      const folderData = {};

      // Sort into folders
      for (const setting of uiSettings)
      {
         if (typeof setting.folder === 'string')
         {
            const folderName = localize(setting.folder);

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
      const folders = Object.entries(folderData).map((entry) => ({ name: entry[0], settings: entry[1] }));

      return {
         topLevel,
         folders
      };
   }
}

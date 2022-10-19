import { writable } from 'svelte/store';

import { localize } from '@typhonjs-fvtt/svelte/helper'

import {
   ripple,
   rippleFocus }    from "@typhonjs-fvtt/svelte-standard/action";

export class UIControl
{
   /** @type {TJSGameSettings} */
   #settings;

   #showSettings = false;
   #showSettingsSet;

   #stores;

   #current;

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

   create()
   {
      this.#current = this.#parseSettings();
      return this.#current;
   }

   swapShowSettings()
   {
      this.#showSettings = !this.#showSettings;
      this.#showSettingsSet(this.#showSettings);
      return this.#showSettings;
   }

   #handleShowState()
   {

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

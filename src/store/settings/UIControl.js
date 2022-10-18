import { writable } from 'svelte/store';

import { localize } from '@typhonjs-fvtt/svelte/helper'

export class UIControl
{
   /** @type {TJSGameSettings} */
   #settings;

   #showSettings = false;

   #stores;

   #current;

   /**
    * @param {TJSGameSettings}   settings -
    */
   constructor(settings)
   {
      this.#settings = settings;

      this.#stores = {
         showSettings: writable(this.#showSettings)
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
      this.#stores.showSettings.set(this.#showSettings);
   }

   create()
   {
      this.#current = this.#parseSettings();
      return this.#current;
   }

   swapShowSettings()
   {
      this.#showSettings = !this.#showSettings;
      this.#stores.showSettings.set(this.#showSettings);
      return this.#showSettings;
   }

   #handleShowState()
   {

   }

   #parseSettings()
   {
      const uiSettings = [];

      for (const setting of this.#settings)
      {
         if (!setting.config) { continue; }

         let choices;

         if (typeof setting.choices === 'object')
         {
            choices = Object.entries(setting.choices).map((entry) => ({ value: entry[0], text: localize(entry[1]) }));
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

         /*
            s.type = setting.type instanceof Function ? setting.type.name : "String";
            s.isCheckbox = setting.type === Boolean;
            s.isSelect = s.choices !== undefined;
            s.isRange = (setting.type === Number) && s.range;
            s.isNumber = setting.type === Number;
            s.filePickerType = s.filePicker === true ? "any" : s.filePicker;

            filePickerType: setting.filePicker === true ? 'any' : setting.filePicker;
          */

         // Parse type:

         // Default to `String` if no type is provided.
         let type = setting.type instanceof Function ? setting.type.name : 'String';

         /** @type {string} */
         let componentType = 'text';

         if (setting.type === Boolean) { componentType = 'checkbox'; }
         if (choices !== void 0) { componentType = 'select'; }
         if (setting.type === Number)
         {
            componentType = typeof setting.range === 'object' ? 'range' : 'number'
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
            filePickerType: setting.filePicker === true ? 'any' : setting.filePicker,
            choices,
            range,
            store: writable(game.settings.get(setting.namespace, setting.key))
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

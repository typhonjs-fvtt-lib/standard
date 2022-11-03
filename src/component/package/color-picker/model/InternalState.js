import { writable }        from 'svelte/store';

import { propertyStore }   from '@typhonjs-svelte/lib/store';
import { isObject }        from '@typhonjs-svelte/lib/util';

export class InternalState
{
   #externalData = {};
   #internalData = {};

   #lastIsPopup;

   #stores;

   constructor(options)
   {
      const opts = isObject(options) ? options : {};

      this.#externalData.isAlpha = typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true;

      this.#lastIsPopup = this.#externalData.isPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#externalData.isTextInput = typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true;

      // Set in updateColor
      this.#internalData.isDark = false;

      this.#internalData.isOpen = typeof opts.isOpen === 'boolean' ? opts.isOpen : !this.#externalData.isPopup;

      // Set by the respective wrapper; the Chrome wrapper will set this to true.
      this.#internalData.toRight = false;

      const externalData = writable(this.#externalData);
      const internalData = writable(this.#internalData);

      this.#stores = {
         isAlpha: propertyStore(externalData, 'isAlpha'),
         isTextInput: propertyStore(externalData, 'isTextInput'),
         isPopup: propertyStore(externalData, 'isPopup'),

         isDark: propertyStore(internalData, 'isDark'),
         isOpen: propertyStore(internalData, 'isOpen'),
         toRight: propertyStore(internalData, 'toRight')
      }

console.log(`!! InternalState - ctor - this.#externalData: `, this.#externalData)
console.log(`!! InternalState - ctor - this.#internalData: `, this.#internalData)
   }

   get isOpen()
   {
      return this.#internalData.isOpen;
   }

   get stores()
   {
      return this.#stores;
   }

   set isOpen(isOpen)
   {
      this.#stores.isOpen.set(isOpen);
   }

   swapIsOpen()
   {
      const result = !this.#internalData.isOpen;

      this.#stores.isOpen.set(result);

      return result;
   }

   update(options)
   {
      const opts = isObject(options) ? options : {};

      this.#stores.isAlpha.set(typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true);

      const newIsPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#stores.isPopup.set(newIsPopup);

      this.#stores.isTextInput.set(typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true);

      // Only reset `isOpen` if external `options.isPopup` has changed. When isPopup is false isOpen must be true.
      if (newIsPopup !== this.#lastIsPopup)
      {
         this.#stores.isOpen.set(!this.#externalData.isPopup);
         this.#lastIsPopup = newIsPopup;
      }

console.log(`!! InternalState - update - this.#externalData: `, this.#externalData)
console.log(`!! InternalState - update - this.#internalData: `, this.#internalData)
   }
}

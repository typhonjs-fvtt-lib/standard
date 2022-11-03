import { writable }        from 'svelte/store';

import { propertyStore }   from '@typhonjs-svelte/lib/store';
import { isObject }        from '@typhonjs-svelte/lib/util';

export class InternalState
{
   #externalData = {};
   #internalData = {};

   #stores;

   constructor(options)
   {
      const opts = isObject(options) ? options : {};

      this.#externalData.isAlpha = typeof opts.isAlpha === 'boolean' ? opts.isAlpha : true;

      this.#externalData.isPopup = typeof opts.isPopup === 'boolean' ? opts.isPopup : true;

      this.#externalData.isTextInput = typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true;

      this.#externalData.toRight = typeof opts.toRight === 'boolean' ? opts.toRight : false;

      this.#internalData.isOpen = typeof opts.isOpen === 'boolean' ? opts.isOpen : !this.#externalData.isPopup;

      const externalData = writable(this.#externalData);
      const internalData = writable(this.#internalData);

      this.#stores = {
         isAlpha: propertyStore(externalData, 'isAlpha'),
         isTextInput: propertyStore(externalData, 'isTextInput'),
         isPopup: propertyStore(externalData, 'isPopup'),
         toRight: propertyStore(externalData, 'toRight'),

         isOpen: propertyStore(internalData, 'isOpen'),
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

      this.#stores.isPopup.set(typeof opts.isPopup === 'boolean' ? opts.isPopup : true);

      this.#stores.isTextInput.set(typeof opts.isTextInput === 'boolean' ? opts.isTextInput : true);

      this.#stores.toRight.set(typeof opts.toRight === 'boolean' ? opts.toRight : false);

      this.#stores.isOpen.set(!this.#externalData.isPopup);
   }
}

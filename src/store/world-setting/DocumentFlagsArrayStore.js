import { TJSDocument }        from '@typhonjs-fvtt/svelte/store';

import { ArrayObjectStore }   from './ArrayObjectStore.js';

/**
 * @typedef {typeof import('svelte/store').Writable & { get id: string }} BaseEntryStore
 */

/**
 * @template {BaseEntryStore} T
 */
export class DocumentFlagsArrayStore extends ArrayObjectStore
{
   /** @type {foundry.abstract.Document} */
   #document;

   /**
    * @type {TJSDocument}
    */
   #tjsDocument = new TJSDocument();

   #key;

   #moduleId;

   /**
    *
    * @param {object}            params - Required parameters.
    *
    * @param {string}            params.moduleId - Flags 'moduleId' field.
    *
    * @param {string}            params.key - Flags 'key' field.
    *
    * @param {ArrayObjectStoreParams} params.rest - Rest of ArrayObjectStore parameters.
    *
    */
   constructor({ document, moduleId, key, ...rest })
   {
      super(rest);

      this.#moduleId = moduleId;

      this.#key = key;

      this.document = document;
   }

   /**
    * @returns {foundry.abstract.Document}
    */
   get document() { return this.#document; }

   /**
    * @returns {string}
    */
   get key() { return this.#key; }

   /**
    * @returns {string}
    */
   get moduleId() { return this.#moduleId; }

   set document(document)
   {
      if (document !== void 0 && !(document instanceof foundry.abstract.Document))
      {
         throw new TypeError(`'document' is not an instance of 'foundry.abstract.Document'.`);
      }
   }
}

// import { TJSDocument }        from '#runtime/svelte/store';
//
// import { ArrayObjectStore }   from '../array-object';
//
// /**
//  * @template [T=import('../array-object/index').BaseEntryStore]
//  *
//  * TODO: TO BE COMPLETED
//  */
// export class DocumentFlagArrayStore extends ArrayObjectStore
// {
//    /**
//     * @type {TJSDocument}
//     */
//    #tjsDocument = new TJSDocument({ delete: this.clearEntries.bind(this) });
//
//    /** @type {string} */
//    #key;
//
//    /** @type {string} */
//    #namespace;
//
//    /** @type {boolean} */
//    #updateGate = false;
//
//    /**
//     *
//     * @param {object}            params - Required parameters.
//     *
//     * @param {foundry.abstract.Document} params.document - A document.
//     *
//     * @param {string}            params.namespace - Flags 'namespace' field.
//     *
//     * @param {string}            params.key - Flags 'key' field.
//     *
//     * @param {ArrayObjectStoreParams} params.rest - Rest of ArrayObjectStore parameters.
//     */
//    constructor({ document, namespace, key, ...rest })
//    {
//       super({
//          ...rest,
//          manualUpdate: false,
//          defaultData: []
//       });
//
//       if (typeof key !== 'string') { throw new TypeError(`'key' is not a string.`); }
//       if (typeof namespace !== 'string') { throw new TypeError(`'namespace' is not a string.`); }
//
//       this.#namespace = namespace;
//
//       this.#key = key;
//
//       this.#tjsDocument = new TJSDocument({ delete: this.clearEntries.bind(this) });
//       this.#tjsDocument.subscribe(this.#documentUpdate.bind(this));
//
//       this.document = document;
//    }
//
//    /**
//     * @returns {foundry.abstract.Document}
//     */
//    get document() { return this.#tjsDocument.get(); }
//
//    /**
//     * @returns {string}
//     */
//    get key() { return this.#key; }
//
//    /**
//     * @returns {string}
//     */
//    get namespace() { return this.#namespace; }
//
//    /**
//     * @param {foundry.abstract.Document} document - New document to set.
//     */
//    set document(document)
//    {
//       this.#tjsDocument.set(document);
//
//       if (document)
//       {
//          const data = document.getFlag(this.#namespace, this.#key);
//
//          if (Array.isArray(data))
//          {
//             this.#updateGate = true;
//             this.set(data);
//             this.#updateGate = false;
//          }
//          else
//          {
//             this.clearEntries();
//          }
//       }
//       else
//       {
//          this.clearEntries();
//       }
//    }
//
//    #documentUpdate()
//    {
//
//    }
// }

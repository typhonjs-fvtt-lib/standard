export * from './ArrayObjectStore.js';
export * from './CrudArrayObjectStore.js';
export * from './ObjectEntryStore.js';

/**
 * @typedef {object} ArrayObjectStoreParams
 *
 * @property {BaseEntryStore} StoreClass - The entry store class that is instantiated.
 *
 * @property {object[]}       [defaultData=[]] - An array of default data objects.
 *
 * @property {number}         [childDebounce=250] - An integer between and including 0 - 1000; a debounce time in
 *                            milliseconds for child store subscriptions to invoke
 *                            {@link ArrayObjectStore.updateSubscribers} notifying subscribers to this array
 *                            store.
 *
 * @property {boolean}        [dataReducer=false] - When true a DynArrayReducer will be instantiated wrapping store
 *                                                  data and accessible from {@link ArrayObjectStore.dataReducer}.
 *
 * @property {boolean}        [manualUpdate=false] - When true {@link ArrayObjectStore.updateSubscribers} must be
 *                            invoked with a single boolean parameter for subscribers to be updated.
 */

/**
 * @typedef {boolean|object|undefined} ArrayObjectUpdateData
 */

/* eslint-disable */  // jsdoc/valid-types doesn't like the import in typedef. TODO: verify in future eslint-plugin-jsdoc version
/**
 * @typedef {import('#svelte/store').Writable & { get id: string }} BaseEntryStore
 */
/* eslint-enable */

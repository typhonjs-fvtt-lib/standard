import * as svelte_store from 'svelte/store';

type CrudArrayObjectStoreParams = ArrayObjectStoreParams;
type BaseEntryStore = typeof svelte_store.Writable & {
    get id(): string;
};
type ArrayObjectStoreParams = {
    /**
     * - The entry store class that is instantiated.
     */
    StoreClass: BaseEntryStore;
    /**
     * - An array of default data objects.
     */
    defaultData?: object[];
    /**
     * - An integer between and including 0 - 1000; a debounce time in
     * milliseconds for child store subscriptions to invoke
     * {@link ArrayObjectStore.updateSubscribers } notifying subscribers to this array
     * store.
     */
    childDebounce?: number;
    /**
     * - When true a DynArrayReducer will be instantiated wrapping store
     *    data and accessible from {@link ArrayObjectStore.dataReducer }.
     */
    dataReducer?: boolean;
    /**
     * - When true {@link ArrayObjectStore.updateSubscribers } must be
     * invoked with a single boolean parameter for subscribers to be updated.
     */
    manualUpdate?: boolean;
};
type ArrayObjectUpdateData = boolean | object | undefined;
/**
 * @typedef {typeof import('svelte/store').Writable & { get id: string }} BaseEntryStore
 */
/**
 * @template {BaseEntryStore} T
 */
declare class ArrayObjectStore<T extends unknown> {
    /**
     * @returns {ObjectEntryStore}
     */
    static get EntryStore(): ObjectEntryStore;
    /**
     * @param {ArrayObjectStoreParams} params -
     */
    constructor({ StoreClass, defaultData, childDebounce, dataReducer, manualUpdate }?: ArrayObjectStoreParams);
    /**
     * @returns {T[]}
     * @protected
     */
    protected get _data(): T[];
    /**
     * @returns {DynArrayReducer<T>}
     */
    get dataReducer(): any;
    /**
     * @returns {number}
     */
    get length(): number;
    /**
     * Removes all child store entries.
     */
    clearEntries(): void;
    /**
     * Creates a new store from given data.
     *
     * @param {object}   entryData -
     *
     * @returns {T}
     */
    createEntry(entryData?: object): T;
    /**
     * Deletes a given entry store by ID from this world setting array store instance.
     *
     * @param {string}  id - ID of entry to delete.
     *
     * @returns {boolean} Delete operation successful.
     */
    deleteEntry(id: string): boolean;
    /**
     * Duplicates an entry store by the given ID.
     *
     * @param {string}   id - UUIDv4 string.
     *
     * @returns {*} Instance of StoreClass.
     */
    duplicateEntry(id: string): any;
    /**
     * Find an entry in the backing child store array.
     *
     * @param {function(T): T|void}  predicate - A predicate function
     *
     * @returns {T|void} Found entry in array or undefined.
     */
    findEntry(predicate: (arg0: T) => T | void): T | void;
    /**
     * Finds an entry store instance by 'id' / UUIDv4.
     *
     * @param {string}   id - A UUIDv4 string.
     *
     * @returns {T|void} Entry store instance.
     */
    getEntry(id: string): T | void;
    /**
     * Sets the children store data by 'id', adds new entry store instances, or removes entries that are no longer in the
     * update list.
     *
     * @param {T[]}   updateList
     */
    set(updateList: T[]): void;
    toJSON(): T[];
    /**
     * @param {function(T[]): void} handler - Callback function that is invoked on update / changes.
     *
     * @returns {(function(): void)} Unsubscribe function.
     */
    subscribe(handler: (arg0: T[]) => void): (() => void);
    /**
     * Updates subscribers.
     *
     * @param {ArrayObjectUpdateData}  [update] -
     */
    updateSubscribers(update?: ArrayObjectUpdateData): void;
    /**
     * Provide an iterator for public access to entry stores.
     *
     * @returns {Generator<T | void>}
     * @yields {T|void}
     */
    [Symbol.iterator](): Generator<T | void>;
    #private;
}
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
/**
 * @template {BaseEntryStore} T
 */
declare class CrudArrayObjectStore<T extends unknown> extends ArrayObjectStore<any> {
    /**
     * @param {object}                  [opts] - Optional parameters.
     *
     * @param {CrudDispatch}            [opts.crudDispatch] -
     *
     * @param {object}                  [opts.extraData] -
     *
     * @param {ArrayObjectStoreParams}  [opts.rest] - Rest of ArrayObjectStore parameters.
     */
    constructor({ crudDispatch, extraData, ...rest }?: {
        crudDispatch?: any;
        extraData?: object;
        rest?: ArrayObjectStoreParams;
    });
    #private;
}
/**
 * Provides a base implementation for store entries in {@link ArrayObjectStore}.
 *
 * In particular providing the required getting / accessor for the 'id' property.
 */
declare class ObjectEntryStore {
    /**
     * Invoked by ArrayObjectStore to provide custom duplication. Override this static method in your entry store.
     *
     * @param {object}   data - A copy of local data w/ new ID already set.
     *
     * @param {ArrayObjectStore} arrayStore - The source ArrayObjectStore instance.
     */
    static duplicate(data: object, arrayStore: ArrayObjectStore<any>): void;
    /**
     * @param {object}   data -
     */
    constructor(data?: object);
    /**
     * @returns {object}
     * @protected
     */
    protected get _data(): any;
    /**
     * @returns {string}
     */
    get id(): string;
    toJSON(): any;
    /**
     * @param {function(object): void} handler - Callback function that is invoked on update / changes.
     *
     * @returns {(function(): void)} Unsubscribe function.
     */
    subscribe(handler: (arg0: object) => void): (() => void);
    /**
     * @protected
     */
    protected _updateSubscribers(): void;
    #private;
}
/**
 * @template {BaseEntryStore} T
 */
declare class WorldSettingArrayStore<T extends unknown> extends CrudArrayObjectStore<any> {
    /**
     *
     * @param {object}            [opts] - Optional parameters.
     *
     * @param {TJSGameSettings}   [opts.gameSettings] - An instance of TJSGameSettings.
     *
     * @param {string}            [opts.namespace] - Game setting 'namespace' field.
     *
     * @param {string}            [opts.key] - Game setting 'key' field.
     *
     * @param {CrudArrayObjectStoreParams} [opts.rest] - Rest of CrudArrayObjectStore parameters.
     */
    constructor({ gameSettings, namespace, key, ...rest }?: {
        gameSettings?: any;
        namespace?: string;
        key?: string;
        rest?: CrudArrayObjectStoreParams;
    });
    /**
     * @returns {string}
     */
    get key(): string;
    /**
     * @returns {string}
     */
    get namespace(): string;
    #private;
}
/**
 * @typedef {ArrayObjectStoreParams} CrudArrayObjectStoreParams
 *
 * @property {CrudDispatch}   [crudDispatch] -
 *
 * @property {object}         [extraData] -
 */
/**
 * @typedef {({ action: string, id?: string, data?: object }) => boolean} CrudDispatch
 *
 * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string and
 * 'data' property.
 */
/**
 * Creates a filter function to compare objects by a give property key against a regex test. The returned function
 * is also a writable Svelte store that builds a regex from the stores value.
 *
 * This filter function can be used w/ DynArrayReducer and bound as a store to input elements.
 *
 * @param {string}   property - Property key to compare.
 *
 * @param {object}   [opts] - Optional parameters.
 *
 * @param {boolean}  [opts.caseSensitive=false] - When true regex test is case-sensitive.
 *
 * @returns {(data: object) => boolean} The query string filter.
 */
declare function createFilterQuery(property: string, { caseSensitive }?: {
    caseSensitive?: boolean;
}): (data: object) => boolean;
/**
 * => boolean} CrudDispatch
 *
 * A function that accepts an object w/ 'action', 'moduleId', 'key' properties and optional 'id' / UUIDv4 string and
 * 'data' property.
 */
type createFilterQuery = ({
    action: string;
    id?: string;
    data?: object;
});
/**
 * Wraps a writable stores set method invoking a callback after the store is set. This allows hard coupled parent /
 * child relationships between stores to update directly without having to subscribe to the child store. This is a
 * particular powerful pattern when the `setCallback` is a debounced function that syncs a parent store and / or
 * serializes data.
 *
 * Note: Do consider carefully if this is an optimum solution; this is a quick implementation helper, but a better
 * solution is properly managing store relationships through subscription.
 *
 * @template T
 *
 * @param {import('svelte/store').Writable<T>} store - A store to wrap.
 *
 * @param {(store?: import('svelte/store').Writable<T>, value?: T) => void} setCallback - A callback to invoke after
 *                                                                                        store set.
 *
 * @returns {import('svelte/store').Writable<T>} Wrapped store.
 */
declare function storeCallback<T>(store: svelte_store.Writable<T>, setCallback: (store?: svelte_store.Writable<T>, value?: T) => void): svelte_store.Writable<T>;

export { ArrayObjectStore, ArrayObjectStoreParams, ArrayObjectUpdateData, BaseEntryStore, CrudArrayObjectStore, CrudArrayObjectStoreParams, ObjectEntryStore, WorldSettingArrayStore, createFilterQuery, storeCallback };

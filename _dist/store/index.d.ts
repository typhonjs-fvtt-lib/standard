import * as svelte_store from 'svelte/store';

type BaseEntryStore = typeof svelte_store.Writable & {
    get id(): string;
};
/**
 * @typedef {typeof import('svelte/store').Writable & { get id: string }} BaseEntryStore
 */
/**
 * @template {BaseEntryStore} T
 */
declare class WorldSettingArrayStore<T extends unknown> {
    /**
     *
     * @param {TJSGameSettings}   gameSettings - An instance of TJSGameSettings.
     *
     * @param {string}            moduleId - Game setting 'moduleId' field.
     *
     * @param {string}            key - Game setting 'key' field.
     *
     * @param {BaseEntryStore}    StoreClass - The entry store class that is instantiated.
     *
     * @param {object[]}          [defaultData=[]] - An array of default data objects.
     *
     * @param {number}            [childDebounce=500] - An integer between and including 0 - 1000; a debounce time in
     *                            milliseconds for child store subscriptions to invoke
     *                            {@link WorldSettingArrayStore._updateSubscribers} notifying subscribers to this array
     *                            store.
     */
    constructor({ gameSettings, moduleId, key, StoreClass, defaultData, childDebounce }?: any);
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
     * @returns {string}
     */
    get key(): string;
    /**
     * Adds a new store from given data.
     *
     * @param {object}   entryData -
     *
     * @returns {*}
     */
    add(entryData?: object): any;
    /**
     * Deletes a given entry store by ID from this world setting array store instance.
     *
     * @param {string}  id - ID of entry to delete.
     *
     * @returns {boolean} Delete operation successful.
     */
    delete(id: string): boolean;
    /**
     * Duplicates an entry store by the given ID.
     *
     * @param {string}   id - UUIDv4 string.
     *
     * @returns {*} Instance of StoreClass.
     */
    duplicate(id: string): any;
    /**
     * Finds an entry store instance by 'id' / UUIDv4.
     *
     * @param {string}   id - A UUIDv4 string.
     *
     * @returns {T|void} Entry store instance.
     */
    find(id: string): T | void;
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
     * @package
     */
    _updateSubscribers(): void;
    #private;
}
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
 * Wraps a writable stores set method invoking a callback after the store is set. This allows parent / child
 * relationships between stores to update directly without having to subscribe to the child store. This is a particular
 * powerful pattern when the `setCallback` is a debounced function that syncs a parent store and / or serializes data.
 *
 * @param {import('svelte/store').Writable} store - A store to wrap.
 *
 * @param {(store?: import('svelte/store').Writable, value?: *) => void} setCallback - A callback to invoke after store
 *                                                                                     set.
 *
 * @returns {import('svelte/store').Writable} Wrapped store.
 */
declare function storeCallback(store: svelte_store.Writable<any>, setCallback: (store?: svelte_store.Writable<any>, value?: any) => void): svelte_store.Writable<any>;

export { BaseEntryStore, WorldSettingArrayStore, createFilterQuery, storeCallback };

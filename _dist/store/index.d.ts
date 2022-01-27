/**
 * Provides a managed array with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support.
 *
 * @template T
 */
declare class DynArrayReducer<T> {
    /**
     * Initializes DynArrayReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
     * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
     *
     * @param {Iterable<T>|DynData<T>}   data - Data iterable to store if array or copy otherwise.
     */
    constructor(data?: Iterable<T> | any);
    /**
     * @returns {AdapterFilters<T>} The filters adapter.
     */
    get filters(): AdapterFilters<T>;
    /**
     * Returns the Indexer public API.
     *
     * @returns {IndexerAPI & Iterable<number>} Indexer API - is also iterable.
     */
    get index(): any;
    /**
     * Gets the main data / items length.
     *
     * @returns {number} Main data / items length.
     */
    get length(): number;
    /**
     * @returns {AdapterSort<T>} The sort adapter.
     */
    get sort(): AdapterSort<T>;
    /**
     *
     * @param {function(DynArrayReducer<T>): void} handler - Callback function that is invoked on update / changes.
     *                                                       Receives `this` reference.
     *
     * @returns {(function(): void)} Unsubscribe function.
     */
    subscribe(handler: (arg0: DynArrayReducer<T>) => void): (() => void);
    /**
     * Provides an iterator for data stored in DynArrayReducer.
     *
     * @returns {Generator<*, T, *>} Generator / iterator of all data.
     * @yields {T}
     */
    [Symbol.iterator](): Generator<any, T, any>;
    #private;
}
/**
 * Provides the storage and sequencing of managed filters. Each filter added may be a bespoke function or a
 * {@link FilterData} object containing an `id`, `filter`, and `weight` attributes; `filter` is the only required
 * attribute.
 *
 * The `id` attribute can be anything that creates a unique ID for the filter; recommended strings or numbers. This
 * allows filters to be removed by ID easily.
 *
 * The `weight` attribute is a number between 0 and 1 inclusive that allows filters to be added in a
 * predictable order which is especially handy if they are manipulated at runtime. A lower weighted filter always runs
 * before a higher weighted filter. For speed and efficiency always set the heavier / more inclusive filter with a
 * lower weight; an example of this is a keyword / name that will filter out many entries making any further filtering
 * faster. If no weight is specified the default of '1' is assigned and it is appended to the end of the filters list.
 *
 * This class forms the public API which is accessible from the `.filters` getter in the main DynArrayReducer instance.
 * ```
 * const dynArray = new DynArrayReducer([...]);
 * dynArray.filters.add(...);
 * dynArray.filters.clear();
 * dynArray.filters.length;
 * dynArray.filters.remove(...);
 * dynArray.filters.removeBy(...);
 * dynArray.filters.removeById(...);
 * ```
 *
 * @template T
 */
declare class AdapterFilters<T> {
    /**
     * @param {Function} indexUpdate - update function for the indexer.
     *
     * @returns {[AdapterFilters<T>, {filters: FilterData<T>[]}]} Returns this and internal storage for filter adapters.
     */
    constructor(indexUpdate: Function);
    /**
     * @returns {number} Returns the length of the
     */
    get length(): number;
    /**
     * @param {...(FilterFn<T>|FilterData<T>)}   filters -
     */
    add(...filters: (any | any)[]): void;
    clear(): void;
    /**
     * @param {...(FilterFn<T>|FilterData<T>)}   filters -
     */
    remove(...filters: (any | any)[]): void;
    /**
     * Remove filters by the provided callback. The callback takes 3 parameters: `id`, `filter`, and `weight`.
     * Any truthy value returned will remove that filter.
     *
     * @param {function(*, FilterFn<T>, number): boolean} callback - Callback function to evaluate each filter entry.
     */
    removeBy(callback: (arg0: any, arg1: any, arg2: number) => boolean): void;
    removeById(...ids: any[]): void;
    /**
     * Provides an iterator for filters.
     *
     * @returns {Generator<number|undefined, FilterData<T>, *>} Generator / iterator of filters.
     * @yields {FilterData<T>}
     */
    [Symbol.iterator](): Generator<number | undefined, any, any>;
    #private;
}
/**
 * @template T
 */
declare class AdapterSort<T> {
    /**
     * @param {Function} indexUpdate - Function to update indexer.
     *
     * @returns {[AdapterSort<T>, {compareFn: CompareFn<T>}]} This and the internal sort adapter data.
     */
    constructor(indexUpdate: Function);
    /**
     * @param {CompareFn<T>|SortData<T>}  data -
     *
     * A callback function that compares two values. Return > 0 to sort b before a;
     * < 0 to sort a before b; or 0 to keep original order of a & b.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters
     */
    set(data: any | any): void;
    reset(): void;
    #private;
}

export { DynArrayReducer };

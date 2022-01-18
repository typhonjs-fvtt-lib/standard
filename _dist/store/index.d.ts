/**
 * Provides a managed array with non-destructive reducing / filtering / sorting capabilities with subscription /
 * Svelte store support.
 */
declare class DynArrayReducer {
    /**
     * Initializes DynArrayReducer. Any iterable is supported for initial data. Take note that if `data` is an array it
     * will be used as the host array and not copied. All non-array iterables otherwise create a new array / copy.
     *
     * @param {Iterable<*>}   data - Data iterable to store or copy.
     */
    constructor(data?: Iterable<any>);
    get filters(): any;
    get index(): any;
    get length(): number;
    get sort(): any;
    subscribe(handler: any): () => void;
    [Symbol.iterator](): Generator<any, void, unknown>;
    #private;
}

export { DynArrayReducer };

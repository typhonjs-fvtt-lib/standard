// TODO: Refactor for future usage.
// import { writable }        from 'svelte/store';
//
// import { getFormat }       from '#runtime/data/color/colord';
// import { TJSGameSettings } from '#runtime/svelte/store/fvtt/settings';
// import { propertyStore }   from '#runtime/svelte/store/writable-derived';
// import { TJSStyleManager } from '#runtime/util/dom/style';
// import { validate }        from '#runtime/util/semver';
//
// import {
//    isIterable,
//    isObject }              from '#runtime/util/object';
//
// import { DataValidator }   from './DataValidator';
//
// import type {
//    Readable,
//    Subscriber,
//    Unsubscriber,
//    Writable }              from 'svelte/store';
//
// /**
//  * Must be constructed from a TJSGameSettings instance `init` / initialize method called from the `ready` Foundry VTT
//  * hook.
//  */
// class TJSThemeStore
// {
//    /**
//     */
//    #components: TJSThemeStore.Component[] = [];
//
//    /**
//     */
//    #data: TJSThemeStore.Data = {};
//
//    #defaultThemeData: TJSThemeStore.Data = {};
//
//    #initialThemeData: TJSThemeStore.Data = {};
//
//    #storeComponents: Readable<TJSThemeStore.Component[]> = { subscribe: writable(this.#components).subscribe };
//
//    /**
//     * All property stores.
//     */
//    #storeProps: { [key: string]: Writable<string | null> } = {};
//
//    /**
//     */
//    #styleManager: TJSStyleManager;
//
//    /**
//     * Stores the subscribers.
//     */
//    #subscribers: Subscriber<TJSThemeStore.Data>[] = [];
//
//    /**
//     * Stores all CSS variable keys.
//     */
//    #vars: string[] = [];
//
//    /**
//     * Current theme version.
//     */
//    #version: string;
//
//    /**
//     * @param options - Options
//     */
//    constructor(options: TJSThemeStore.Options)
//    {
//       if (!isObject(options)) { throw new TypeError(`'options' is not an object.`); }
//
//       if (typeof options.namespace !== 'string') { throw new TypeError(`'namespace' attribute is not a string.`); }
//
//       if (typeof options.key !== 'string') { throw new TypeError(`'key' attribute is not a string.`); }
//
//       if (!(options.gameSettings instanceof TJSGameSettings))
//       {
//          throw new TypeError(`'gameSettings' attribute is not an instance of TJSGameSettings.`);
//       }
//
//       if (!(options.styleManager instanceof TJSStyleManager))
//       {
//          throw new TypeError(`'styleManager' attribute is not an instance of TJSStyleManager.`);
//       }
//
//       if (!isObject(options.config)) { throw new TypeError(`'config' attribute is not an object. `); }
//
//       if (typeof options.config.version !== 'string')
//       {
//          throw new TypeError(`'config.version' attribute is not a string`);
//       }
//
//       if (!validate(options.config.version))
//       {
//          throw new Error(`'config.version' attribute is not a valid semantic version string.`);
//       }
//
//       this.#version = options.config.version;
//
//       if (!isIterable(options.config.components))
//       {
//          throw new TypeError(`'config.components' attribute is not an iterable list. `);
//       }
//
//       this.#styleManager = options.styleManager;
//
//       this.#initialize(options);
//    }
//
//    /**
//     * @returns A readable store of all components.
//     */
//    get components(): Readable<TJSThemeStore.Component[]> { return this.#storeComponents; }
//
//    /**
//     * @returns All property stores.
//     */
//    get properties(): { [key: string]: Writable<string | null> }
//    {
//       return this.#storeProps;
//    }
//
//    /**
//     * Parse `options.config` and initialize game setting for theme data.
//     *
//     * @param options -
//     */
//    #initialize(options: TJSThemeStore.Options): void
//    {
//       this.#defaultThemeData = {};
//       this.#initialThemeData = Object.assign({}, this.#defaultThemeData);
//
//       let cntr: number = 0;
//
//       // Process component / vars data.
//       for (let entry of options.config.components)
//       {
//          // Validate entry, but also adds additional information based on data types; IE `format` for `color`.
//          entry = DataValidator.componentEntry(entry, cntr);
//
//          // Add var key if defined.
//          if (typeof entry.var === 'string')
//          {
//             const key: string = entry.var;
//
//             this.#vars.push(key);
//             this.#storeProps[key] = propertyStore(this, key);
//             this.#components.push(Object.assign({}, entry, { store: this.#storeProps[key] }));
//
//             if (typeof entry.default === 'string') { this.#defaultThemeData[key] = entry.default; }
//          }
//          else
//          {
//             this.#components.push(Object.assign({}, entry));
//          }
//
//          cntr++;
//       }
//
//       // Set initial data to default here just in case the game setting entry is invalid upon registration / IE null.
//       this.#initialThemeData = Object.assign({}, this.#defaultThemeData);
//
//       options.gameSettings.register({
//          namespace: options.namespace,
//          key: options.key,
//          store: this,
//          options: {
//             scope: 'world',
//             config: false,
//             default: Object.assign({}, this.#defaultThemeData),
//             type: Object
//          }
//       });
//
//       // Retrieve existing data from stored word setting.
//       this.#initialThemeData = game.settings.get(options.namespace, options.key);
//
//       // Validate initial theme data and set to default if it fails to validate.
//       if (!this.#validateThemeData(this.#initialThemeData, false))
//       {
//          console.warn(
//           `TJSThemeStore warning: Initial theme data invalid. Setting to default data.`);
//
//          this.#initialThemeData = Object.assign({}, this.#defaultThemeData);
//
//          this.set(Object.assign({}, this.#initialThemeData));
//       }
//    }
//
//    /**
//     * Sets the theme store with new data.
//     *
//     * @param themeData -
//     *
//     * @returns This theme store instance.
//     */
//    set(themeData: TJSThemeStore.Data): this
//    {
//       if (!this.#validateThemeData(themeData))
//       {
//          themeData = Object.assign({}, this.#initialThemeData);
//       }
//
//       for (const key of this.#vars)
//       {
//          if (key in themeData)
//          {
//             const keyData: string = themeData[key];
//
//             this.#data[key] = keyData;
//             this.#styleManager.setProperty(key, keyData);
//          }
//       }
//
//       this.#updateSubscribers();
//
//       return this;
//    }
//
//    /**
//     * Validates the given theme data object ensuring that all parameters are found and are correct HSVA values.
//     *
//     * @param themeData -
//     *
//     * @param [warn] - When true post warning message.
//     *
//     * @returns Validation status.
//     */
//    #validateThemeData(themeData: TJSThemeStore.Data, warn: boolean = true): boolean
//    {
//       if (!isObject(themeData))
//       {
//          if (warn)
//          {
//             console.warn(`TJSThemeStore warning: 'theme' data is not an object resetting to initial data.`);
//          }
//
//          return false;
//       }
//
//       for (const key of this.#vars)
//       {
//          const data: string = themeData[key];
//
//          if (getFormat(data) !== 'hsl')
//          {
//             if (warn)
//             {
//                console.warn(`TJSThemeStore warning: data for property '${
//                 key}' is not a HSL color string. Resetting to initial data.`);
//             }
//
//             return false;
//          }
//       }
//
//       return true;
//    }
//
//    // ------------
//
//    /**
//     * Updates all subscribers
//     */
//    #updateSubscribers()
//    {
//       const data = Object.assign({}, this.#data);
//
//       // Early out if there are no subscribers.
//       if (this.#subscribers.length > 0)
//       {
//          for (let cntr = 0; cntr < this.#subscribers.length; cntr++) { this.#subscribers[cntr](data); }
//       }
//    }
//
//    /**
//     * @param handler - Callback function that is invoked on update / changes. Receives copy of the theme data.
//     *
//     * @returns Unsubscribe function.
//     */
//    subscribe(handler: Subscriber<TJSThemeStore.Data>): Unsubscriber
//    {
//       this.#subscribers.push(handler); // add handler to the array of subscribers
//
//       handler(Object.assign({}, this.#data));                     // call handler with current value
//
//       // Return unsubscribe function.
//       return (): void =>
//       {
//          const index = this.#subscribers.findIndex((sub) => sub === handler);
//          if (index >= 0) { this.#subscribers.splice(index, 1); }
//       };
//    }
// }
//
// declare namespace TJSThemeStore {
//    export type Component = {
//       /**
//        * An optional default value for a CSS variable.
//        */
//       default?: string;
//
//       /**
//        * Associated color format. Set after initialization.
//        */
//       format?: string;
//
//       /**
//        * An optional label for any variable / setting related component.
//        */
//       label?: string;
//
//       /**
//        * The assigned store when applicable for a CSS variable. Set after initialization.
//        */
//       store?: Writable<string | null>
//
//       /**
//        * Type of component / variable.
//        */
//       type: string;
//
//       /**
//        * A CSS variable name.
//        */
//       var?: string;
//    };
//
//    /**
//     * Theme store data; CSS variable names to value.
//     */
//    export type Data = { [key: string]: string };
//
//    export type Config = {
//       /**
//        * An iterable list of theme store component data.
//        */
//       components: Iterable<Component>;
//
//       /**
//        * A semantic version string.
//        */
//       version: string;
//    };
//
//    export interface Options {
//       /**
//        * Data defining CSS theme store components and variables.
//        */
//       config: Config;
//
//       /**
//        * An associated TJSGameSettings instance.
//        */
//       gameSettings: TJSGameSettings;
//
//       /**
//        * The world game setting key.
//        */
//       key: string;
//
//       /**
//        * The world setting namespace.
//        */
//       namespace: string;
//
//       /**
//        * An associated TJSStyleManager instance to manipulate CSS variables.
//        */
//       styleManager: TJSStyleManager;
//    }
// }
//
// export { TJSThemeStore }

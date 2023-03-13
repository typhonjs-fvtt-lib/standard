/**
 * Provides the ability to mount and control Svelte component based sidebar panels & tabs in the Foundry sidebar.
 *
 * The nice aspect about FVTTSidebarControl is that all you have to provide is the sidebar component and the rest is
 * handled for you including automatically widening the width of the sidebar to fit the new sidebar tab. Also by default
 * an adhoc SvelteApplication is configured to display the sidebar when popped out automatically without the need to
 * associate an app instance.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * To add a new sidebar tab schedule one or more invocations of {@link FVTTSidebarControl.add} in a `setup` hook. You
 * must add all sidebars in the `setup` hook before the main Foundry sidebar renders. Please review all the expanded
 * options available in the configuration object passed to the `add` method. At minimum, you need to provide a unique
 * `id`, `icon`, and `svelte` configuration object. You almost always will want to provide `beforeId` referencing
 * another existing sidebar tab ID to place the tab button before. If undefined the tab is inserted at the end of
 * the sidebar tabs. The default Foundry sidebar tab IDs from left to right are: 'chat', 'combat', 'scenes', 'actors',
 * 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * Optionally:
 * - You can define the `icon` as a Svelte configuration object to load an interactive component instead of
 * using a FontAwesome icon. This allows you to dynamically show state similar to the chat log sidebar when activity
 * occurs or for other purposes.
 *
 * - You can provide `popoutOptions` overriding the default options passed to the default adhoc SvelteApplication
 * rendered for the popout.
 *
 * - You can provide a class that extends from SvelteApplication as `popoutApplication` to provide a fully customized
 * popout sidebar that you fully control.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * There is a method to remove an existing stock Foundry sidebar {@link FVTTSidebarControl.remove}. It takes
 * an `id` field that must be one of the existing Foundry sidebar IDs to remove: chat', 'combat', 'scenes',
 * 'actors', 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * There is a method to replace an existing stock Foundry sidebar {@link FVTTSidebarControl.replace}. It takes
 * the same data as the `add` method, but `id` must be one of the existing Foundry sidebar IDs to replace: chat',
 * 'combat', 'scenes', 'actors', 'items', 'journal', 'tables', 'cards', 'playlists', 'compendium', and 'settings'.
 *
 * Both the `add` and `replace` methods have a data field `mergeAppImpl` that provides the base implementation for the
 * added / replaced object instance assigned to `globalThis.ui.<SIDEBAR APP ID>`. When replacing Foundry core sidebar
 * panels like the {@link CombatTracker} there is additional API that you must handle found in the given core
 * sidebar app implementation. It is recommended that you implement this API as part of the control / model code passed
 * to the Svelte sidebar component and also set to `mergeAppImpl`.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * The {@link FVTTSidebarControl.get} method allows you to retrieve the associated {@link TJSSidebarEntry} for a given
 * sidebar by ID allowing access to the configuration data, popout app, and wrapper components that mount the sidebar.
 *
 * The {@link FVTTSidebarControl.wait} returns a Promise that is resolved after all sidebars have been initialized.
 * allowing handling any special setup as necessary.
 *
 * -------------------------------------------------------------------------------------------------------------------
 *
 * @example Minimal setup
 *
 * Hooks.once('setup', () =>
 * {
 *    FVTTSidebarControl.add({
 *       beforeId: 'items',               // Place new tab before the 'items' tab.
 *       id: 'test',                      // A unique CSS ID.
 *       icon: 'fas fa-dice-d10',         // FontAwesome icon.
 *       condition: () => game.user.isGM, // Optional boolean / function to conditionally run the sidebar action.
 *       title: 'Test Directory',         // Title of popout sidebar app; can be language string.
 *       tooltip: 'Tests',                // Tooltip for sidebar tab.
 *       svelte: {                        // A Svelte configuration object.
 *          class: TestTab                // A Svelte component.
 *       }
 *    });
 * });
 */
declare class FVTTSidebarControl {
    /**
     * @type {object[]}
     */
    static "__#148349@#initData": object[];
    static "__#148349@#initPromise": any;
    /**
     * @type {Map<string, TJSSidebarEntry>}
     */
    static "__#148349@#sidebars": Map<string, TJSSidebarEntry>;
    /**
     * Adds a new Svelte powered sidebar tab / panel.
     *
     * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
     *
     * @param {string}   sidebarData.id - The unique Sidebar ID / name. Used for CSS ID and retrieving the sidebar.
     *
     * @param {string|object}  sidebarData.icon - The FontAwesome icon css classes _or_ a Svelte configuration object
     * to load a custom Svelte component to use as the "icon".
     *
     * @param {object}   sidebarData.svelte - A Svelte configuration object.
     *
     * @param {string}   [sidebarData.beforeId] - The ID for the tab to place the new sidebar before. This must be an
     *        existing sidebar tab ID. THe stock Foundry sidebar tab IDs from left to right are:
     *
     * @param {boolean|Function}   [sidebarData.condition] - A boolean value or function to invoke that returns a
     *        boolean value to control sidebar replacement. This is executed in the `renderSidebar` callback
     *        internally.
     *
     * @param {object}   [sidebarData.mergeAppImpl] - Provides a custom base implementation for the object instance
     *        for this sidebar app stored in `globalThis.ui.<SIDEBAR ID>`.
     *
     * @param {string}   [sidebarData.popoutApplication] - Provides a custom SvelteApplication class to instantiate
     *        for the popout sidebar.
     *
     * @param {string}   [sidebarData.popoutOptions] - Provides SvelteApplication options overrides for the default
     *        popout sidebar.
     *
     * @param {string}   [sidebarData.title] - The popout application title text or i18n lang key.
     *
     * @param {string}   [sidebarData.tooltip] - The sidebar tab tooltip text or i18n lang key.
     */
    static add(sidebarData: {
        id: string;
        icon: string | object;
        svelte: object;
        beforeId?: string;
        condition?: boolean | Function;
        mergeAppImpl?: object;
        popoutApplication?: string;
        popoutOptions?: string;
        title?: string;
        tooltip?: string;
    }): void;
    /**
     * Initializes all sidebars registered after the initial Foundry Sidebar app has been rendered.
     */
    static "__#148349@#initialize"(): void;
    /**
     * Returns a loaded and configured sidebar entry by ID.
     *
     * @param {string}   id - The ID of the sidebar to retrieve.
     *
     * @returns {TJSSidebarEntry} The sidebar entry.
     */
    static get(id: string): TJSSidebarEntry;
    /**
     * Removes an existing sidebar tab / panel.
     *
     * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
     *
     * @param {string}   sidebarData.id - The ID for the sidebar tab to remove. This must be an existing sidebar tab ID.
     *
     * @param {boolean|Function}   [sidebarData.condition] - A boolean value or function to invoke that returns a
     *        boolean value to control sidebar replacement. This is executed in the `renderSidebar` callback
     *        internally.
     */
    static remove(sidebarData: {
        id: string;
        condition?: boolean | Function;
    }): void;
    /**
     * Replaces an existing sidebar tab / panel with a new Svelte powered sidebar.
     *
     * @param {object}   sidebarData - The configuration object for a Svelte sidebar,
     *
     * @param {string|object}  sidebarData.icon - The FontAwesome icon css classes _or_ a Svelte configuration object
     *        to load a custom Svelte component to use as the "icon".
     *
     * @param {string}   sidebarData.id - The ID for the sidebar to replace. This must be an existing sidebar tab ID.
     *
     * @param {object}   sidebarData.svelte - A Svelte configuration object.
     *
     * @param {boolean|Function}   [sidebarData.condition] - A boolean value or function to invoke that returns a
     *        boolean value to control sidebar replacement. This is executed in the `renderSidebar` callback
     *        internally.
     *
     * @param {object}   [sidebarData.mergeAppImpl] - Provides a custom base implementation for the object instance
     *        for this sidebar app stored in `globalThis.ui.<SIDEBAR ID>`.
     *
     * @param {string}   [sidebarData.popoutApplication] - Provides a custom SvelteApplication class to instantiate
     *        for the popout sidebar.
     *
     * @param {string}   [sidebarData.popoutOptions] - Provides SvelteApplication options overrides for the default
     *        popout sidebar.
     *
     * @param {string}   [sidebarData.title] - The popout application title text or i18n lang key.
     *
     * @param {string}   [sidebarData.tooltip] - The sidebar tab tooltip text or i18n lang key.
     */
    static replace(sidebarData: {
        icon: string | object;
        id: string;
        svelte: object;
        condition?: boolean | Function;
        mergeAppImpl?: object;
        popoutApplication?: string;
        popoutOptions?: string;
        title?: string;
        tooltip?: string;
    }): void;
    /**
     * Handles adding the new Svelte sidebar tab / panel.
     *
     * @param {object}   data - Data for tracking sidebar changes.
     *
     * @param {object}   sidebarData - Sidebar data to add.
     */
    static "__#148349@#sidebarAdd"(data: object, sidebarData: object): void;
    /**
     * Handles removing an existing sidebar.
     *
     * @param {object}   data - Data for tracking sidebar changes.
     *
     * @param {object}   sidebarData - Sidebar data to remove.
     */
    static "__#148349@#sidebarRemove"(data: object, sidebarData: object): void;
    /**
     * Handles replacing an existing sidebar with a new Svelte sidebar tab / panel.
     *
     * @param {object}   data - Data for tracking sidebar changes.
     *
     * @param {object}   sidebarData - Sidebar data to replace.
     */
    static "__#148349@#sidebarReplace"(data: object, sidebarData: object): void;
    /**
     * Provides a Promise that is resolved after all added sidebars are initialized. This is useful when additional
     * setup or configuration of sidebars needs to be performed after sidebar initialization.
     *
     * @returns {Promise} Initialization Promise.
     */
    static wait(): Promise<any>;
}
type TJSSidebarEntry = {
    /**
     * - The sidebar data that configures a Svelte sidebar.
     */
    data: object;
    /**
     * - The sidebar popout application.
     */
    popout: SvelteApplication;
    /**
     * - The tab wrapper component.
     */
    tab: FVTTSidebarTab;
    /**
     * - The sidebar wrapper component.
     */
    wrapper: FVTTSidebarWrapper;
};

/**
 * Provides and manages browser window wide context menu functionality. The best way to create a context menu is to
 * attach the source KeyboardEvent or MouseEvent / PointerEvent as data in {@link TJSContextMenu.create}. This allows
 * proper keyboard handling across browsers supporting the context menu key. A A11yFocusSource data object is generated
 * which allows tracking of the source element that triggered the context menu allowing focus to return to the source
 * when the context menu is closed. This A11yFocusSource object is also forwarded on through the `onPress` callback and
 * is intended to be supplied as `SvelteApplication` options particularly for modal dialogs allowing focus to return
 * to the original source after the modal dialog is closed.
 */
declare class TJSContextMenu {
    /**
     * Stores any active context menu.
     */
    static "__#148350@#contextMenu": any;
    /**
     * Creates and manages a browser wide context menu. The best way to create the context menu is to pass in the source
     * DOM event as it is processed for the location of the context menu to display. Likewise, a A11yFocusSource object
     * is generated that allows focus to be returned to the source location. You may supply a default focus target as a
     * fallback via `focusEl`.
     *
     * @param {object}      opts - Optional parameters.
     *
     * @param {string}      [opts.id] - A custom CSS ID to add to the menu. This allows CSS style targeting.
     *
     * @param {KeyboardEvent|MouseEvent}  [opts.event] - The source MouseEvent or KeyboardEvent.
     *
     * @param {number}      [opts.x] - X position override for the top / left of the menu.
     *
     * @param {number}      [opts.y] - Y position override for the top / left of the menu.
     *
     * @param {Iterable<TJSContextMenuItemData>} [opts.items] - Menu items to display.
     *
     * @param {boolean}     [opts.focusDebug] - When true the associated A11yFocusSource object will log focus target
     *        data when applied.
     *
     * @param {HTMLElement|string} [opts.focusEl] - A specific HTMLElement or selector string as the default focus
     *        target.
     *
     * @param {string}      [opts.keyCode='Enter'] - Key to select menu items.
     *
     * @param {Record<string, string>}  [opts.styles] - Optional inline styles to apply.
     *
     * @param {number}      [opts.zIndex=Number.MAX_SAFE_INTEGER - 100] - Z-index for context menu.
     *
     * @param {number}      [opts.duration] - Transition option for duration of transition.
     *
     * @param {Function}    [opts.easing] - Transition option for easing function.
     */
    static create({ id, event, x, y, items, focusDebug, focusEl, keyCode, styles, zIndex, duration, easing, }?: {
        id?: string;
        event?: KeyboardEvent | MouseEvent;
        x?: number;
        y?: number;
        items?: Iterable<TJSContextMenuItemData>;
        focusDebug?: boolean;
        focusEl?: HTMLElement | string;
        keyCode?: string;
        styles?: Record<string, string>;
        zIndex?: number;
        duration?: number;
        easing?: Function;
    }): void;
    /**
     * Processes menu item data for conditions and evaluating the type of menu item.
     *
     * @param {Iterable<TJSContextMenuItemData>} items - Menu item data.
     *
     * @returns {object[]} Processed menu items.
     */
    static "__#148350@#processItems"(items: Iterable<TJSContextMenuItemData>): object[];
}
/**
 * - Defines a menu item entry. Depending on the item data that is passed
 * into the menu you can define 4 types of items: 'icon / label', 'image / label', 'class / Svelte component', and
 * 'separator / hr'. A single callback function `onPress` is supported.
 */
type TJSContextMenuItemData = {
    /**
     * - A callback function that receives the selected
     * item data and an object containing the A11yFocusSource data that can be passed to any Application / particularly modal
     * dialogs returning focus when closed.
     */
    onPress?: (item: TJSContextMenuItemData, object: any) => void;
    /**
     * - If a boolean and false or a function that invoked returns a falsy value
     * this item is not added.
     */
    condition?: boolean | (() => boolean);
    /**
     * - A Svelte component class.
     */
    class?: Function;
    /**
     * - An object passed on as props for any Svelte component.
     */
    props?: object;
    /**
     * - A string containing icon classes.
     */
    icon?: string;
    /**
     * - An image icon path.
     */
    image?: string;
    /**
     * - An image 'alt' text description.
     */
    imageAlt?: string;
    /**
     * - A text string that is passed through localization.
     */
    label?: string;
    /**
     * - A menu item separator; only 'hr' supported.
     */
    separator?: 'hr';
};

export { FVTTSidebarControl, TJSContextMenu, TJSContextMenuItemData, TJSSidebarEntry };

<script>
   /**
    * TJSFolder provides a collapsible folder using the details and summary HTMLElements.
    *
    * This is a slotted component. The default slot is the collapsible contents. There are also two additional optional
    * named slots available for the summary element. `label` allows setting custom content with the fallback being the
    * `label` string. Additionally, `summary-end` allows a component or text to be slotted after the label. This can be
    * useful for say an "expand all" button.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Exported props include:
    * `folder`: An object containing id (any), label (string), store (writable boolean)
    *
    * Or in lieu of passing the folder object you can assign these props directly:
    * `id`: Anything used for an ID.
    * `label`: The label name of the folder; string.
    * `store`: The store tracking the open / close state: writable<boolean>
    *
    * The final prop is `styles` which follows the `applyStyles` action; see `applyStyles` or `StylesProperties`
    * component for more information. This is an object that applies inline styles.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Events: There are several events that are fired and / or bubbled up through parents. There are four
    * custom events that pass a details object including: `the details element, id, label, and store`.
    *
    * The following events are bubbled up such that assigning a listener in any parent component receives them
    * from all children folders:
    * `click` - Basic MouseEvent of folder being clicked.
    * `closeAny` - Triggered when any child folder is closed w/ details object.
    * `openAny` - Triggered when any child folder is opened w/ details object.
    *
    * The following events do not propagate / bubble up and can be registered with:
    * `close` - Triggered when direct descendent folder is closed w/ details object.
    * `open` - Triggered when direct descendent folder is opened w/ details object.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Styling: To style this component use `details.tjs-folder` as a selector. Each element also contains data
    * attributes for `id` and `label`.
    *
    * There are several local CSS variables that you can use to change the appearance dynamically. Either use
    * CSS props or pass in a `styles` object w/ key / value props to set to the details. Another alternative is using
    * `StyleProperties` component which wraps a section in locally defined CSS variables. Useful for a large group of
    * folders where the goal is changing the appearance of all of them as a group.
    *
    * The following CSS variables are supported, but not defined by default.
    *
    * Details element (attributes follow `--tjs-details-`):
    * --tjs-details-padding-left: 5px; set for children to indent more;
    *
    * Summary element (attributes follow `--tjs-summary-`):
    * --tjs-summary-background-blend-mode: initial
    * --tjs-summary-background: none
    * --tjs-summary-border: none
    * --tjs-summary-cursor: pointer
    * --tjs-summary-font-size: inherit
    * --tjs-summary-font-weight: bold
    * --tjs-summary-padding: 4px
    * --tjs-summary-width: fit-content; wraps content initially, set to 100% or other width measurement
    *
    * Summary SVG / chevron element (attributes follow `--tjs-summary-chevron-`):
    *
    * The width and height use multiple fallback variables before setting a default of 15px. You can provide
    * `--tjs-summary-chevron-size`. If not provided then the chevron dimensions are set by `--tjs-summary-font-size`.
    *
    * --tjs-summary-chevron-color: currentColor
    * --tjs-summary-chevron-opacity: 0.2; Opacity when not hovering.
    * --tjs-summary-chevron-rotate-closed: -90deg; rotation angle when closed.
    * --tjs-summary-chevron-opacity-hover: 1; Opacity when hovering.
    * --tjs-summary-chevron-rotate-open: 0; rotation angle when open.
    *
    * Contents element (attributes follow `--tjs-contents-`):
    * --tjs-contents-background-blend-mode: initial
    * --tjs-contents-background: none
    * --tjs-contents-border: none
    * --tjs-contents-margin: 0 0 0 -5px
    *
    * Padding is set directly by `--tjs-contents-padding` or follows the following calculation:
    * `0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8)`
    *
    * If neither `--tjs-contents-padding` or `--tjs-summary-font-size` is defined the default is `13px * 0.8`.
    */

   import { onDestroy }         from 'svelte';
   import { writable }          from 'svelte/store';

   import { applyStyles }       from '@typhonjs-svelte/lib/action';
   import { isSettableStore }   from '@typhonjs-svelte/lib/store';
   import { isObject }          from '@typhonjs-svelte/lib/util';
   import { toggleDetails }     from '@typhonjs-fvtt/svelte-standard/action';

   export let styles;

   /** @type {object} */
   export let folder = void 0;
   export let id = isObject(folder) ? folder.id : void 0;
   export let iconOpen = isObject(folder) ? folder.iconOpen : '';
   export let iconClosed = isObject(folder) ? folder.iconClosed : '';
   export let label = isObject(folder) ? folder.label : '';
   export let store = isObject(folder) ? folder.store : writable(false);
   export let onClick = isObject(folder) ? folder.onClick : () => null;
   export let onContextMenu = isObject(folder) ? folder.onContextMenu : () => null;

   let detailsEl;
   let currentIcon;

   $: id = isObject(folder) ? folder.id : typeof id === 'string' ? id : void 0;
   $: iconOpen = isObject(folder) ? folder.iconOpen : typeof iconOpen === 'string' ? iconOpen : void 0;
   $: iconClosed = isObject(folder) ? folder.iconClosed : typeof iconClosed === 'string' ? iconClosed : void 0;
   $: label = isObject(folder) ? folder.label : typeof label === 'string' ? label : '';
   $: store = isObject(folder) && isSettableStore(folder.store) ? folder.store : isSettableStore(store) ? store :
    writable(false);
   $: onClick = isObject(folder) && typeof folder.onClick === 'function' ? folder.onClick :
    typeof onClick === 'function' ? onClick : () => null;
   $: onContextMenu = isObject(folder) && typeof folder.onContextMenu === 'function' ? folder.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : () => null;

   $:
   {
      const iconData = $store ? iconOpen : iconClosed;
      currentIcon = typeof iconData !== 'string' ? void 0 : iconData;
   }

   /**
    * Create a CustomEvent with details object containing relevant element and props.
    *
    * @param {string}   type - Event name / type.
    *
    * @param {boolean}  [bubbles=false] - Does the event bubble.
    *
    * @returns {CustomEvent<object>}
    */
   function createEvent(type, bubbles = false)
   {
      return new CustomEvent(type, {
         detail: {element: detailsEl, folder, id, label, store},
         bubbles
      });
    }

   // Manually subscribe to store in order to trigger only on changes; avoids initial dispatch on mount as `detailsEl`
   // is not set yet. Directly dispatch custom events as Svelte 3 does not support bubbling of custom events by
   // `createEventDispatcher`.
   const unsubscribe = store.subscribe((value) =>
   {
      if (detailsEl)
      {
         detailsEl.dispatchEvent(createEvent(value ? 'open' : 'close'));
         detailsEl.dispatchEvent(createEvent(value ? 'openAny' : 'closeAny', true));
      }
   });

   onDestroy(unsubscribe);
</script>

<details class=tjs-icon-folder
         bind:this={detailsEl}
         on:click
         on:open
         on:close
         on:openAny
         on:closeAny
         use:toggleDetails={store}
         use:applyStyles={styles}
         data-id={id}
         data-label={label}
         data-closing='false'>
    <summary on:click={onClick} on:contextmenu={onContextMenu}>
        {#if currentIcon}<i class={currentIcon}></i>{/if}

        <slot name=label>{label}</slot>

        <slot name="summary-end"></slot>
    </summary>

    <div class=contents>
        <slot></slot>
    </div>
</details>

<style>
    details {
        margin-left: -5px;
        padding-left: var(--tjs-details-padding-left, 5px); /* Set for children folders to increase indent */
    }

    summary {
        display: flex;
        position: relative;
        align-items: center;
        background-blend-mode: var(--tjs-summary-background-blend-mode, initial);
        background: var(--tjs-summary-background, none);
        border: var(--tjs-summary-border, none);
        border-radius: var(--tjs-summary-border-radius, 0);
        border-width: var(--tjs-summary-border-width, initial);
        cursor: var(--tjs-summary-cursor, pointer);
        font-size: var(--tjs-summary-font-size, inherit);
        font-weight: var(--tjs-summary-font-weight, bold);
        list-style: none;
        margin: var(--tjs-summary-margin, 0);
        padding: var(--tjs-summary-padding, 4px) 0;
        user-select: none;
        width: var(--tjs-summary-width, fit-content);

        transition: background 0.1s;
    }

    summary i {
        color: var(--tjs-summary-chevron-color, currentColor);
        opacity: var(--tjs-summary-chevron-opacity, 1);
        margin: 0 0 0 0.25em;
        width: var(--tjs-summary-chevron-width, 1.65em);
        transition: opacity 0.2s;
    }

    summary:hover i {
        opacity: var(--tjs-summary-chevron-opacity-hover, 1);
    }

    details[open] > summary {
        background: var(--tjs-summary-background-open, var(--tjs-summary-background, inherit));
    }

    .contents {
        position: relative;
        background-blend-mode: var(--tjs-contents-background-blend-mode, initial);
        background: var(--tjs-contents-background, none);
        border: var(--tjs-contents-border, none);
        margin: var(--tjs-contents-margin, 0 0 0 -5px);
        padding: var(--tjs-contents-padding, 0 0 0 calc(var(--tjs-summary-font-size, 13px) * 0.8));
    }

    .contents::before {
        content: '';
        position: absolute;
        width: 0;
        height: calc(100% + 8px);
        left: 0;
        top: -8px;
    }

    summary:focus-visible + .contents::before {
        height: 100%;
        top: 0;
    }
</style>

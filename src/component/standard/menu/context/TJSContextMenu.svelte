<script>
   import {
      createEventDispatcher,
      onMount }                     from 'svelte';

   import { current_component }     from 'svelte/internal';

   import { applyStyles }           from '@typhonjs-svelte/lib/action';
   import { localize }              from '@typhonjs-svelte/lib/helper';
   import { slideFade }             from '@typhonjs-svelte/lib/transition';

   import {
      A11yHelper,
      isIterable,
      isObject,
      isSvelteComponent,
      outroAndDestroy }             from '@typhonjs-svelte/lib/util';

   import { TJSFocusWrap }          from '@typhonjs-fvtt/svelte/component/core';

   export let menu = void 0;

   export let id = '';

   export let x = 0;

   export let y = 0;

   export let items = [];

   export let zIndex = 10000;

   /** @type {Record<string, string>} */
   export let styles = void 0;

   /** @type {string} */
   export let keyCode = void 0;

   export let focusOptions = void 0;

   /** @type {{ duration: number, easing: Function }} */
   export let transitionOptions = void 0;

   $: styles = isObject(menu) && isObject(menu.styles) ? menu.styles :
    isObject(styles) ? styles : void 0;

   $: keyCode = isObject(menu) && typeof menu.keyCode === 'string' ? menu.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   // Provides options to `A11yHelper.getFocusableElements` to ignore TJSFocusWrap by CSS class.
   const s_IGNORE_CLASSES = { ignoreClasses: ['tjs-focus-wrap'] };

   // Store this component reference.
   const local = current_component;

   // Dispatches `close` event.
   const dispatch = createEventDispatcher();

   // Bound to the nav element / menu.
   let menuEl;

   // Stores if this context menu is closed.
   let closed = false;

   // Stores if menu has keyboard focus; detected on mount, when tab navigation occurs, and used to set `keypress` for
   // close event.
   // let hasKeyboardFocus = false;

   // ----------------------------------------------------------------------------------------------------------------

   onMount(() =>
   {
      const keyboardFocus = focusOptions?.source === 'keyboard';

      // If the focus options designate that the source of the context menu came from the keyboard then focus the first
      // menu item on mount.
      if (keyboardFocus)
      {
         const firstFocusEl = A11yHelper.getFirstFocusableElement(menuEl);
         if (firstFocusEl instanceof HTMLElement && !firstFocusEl.classList.contains('tjs-focus-wrap'))
         {
            firstFocusEl.focus();
         }
         else
         {
            // Silently focus the menu element so that keyboard handling functions.
            menuEl.focus();
         }
      }
      else
      {
         // Silently focus the menu element so that keyboard handling functions.
         menuEl.focus();
      }
   });

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Provides a custom animate callback allowing inspection of the element to change positioning styles based on the
    * height / width of the element and `document.body`. This allows the context menu to expand up when the menu
    * is outside the height bound of `document.body` and expand to the left if width is greater than `document.body`.
    *
    * @param {HTMLElement} node - nav element.
    *
    * @returns {object} Transition object.
    */
   function animate(node)
   {
      const expandUp = y + node.clientHeight > document.body.clientHeight
      const expandLeft = x + node.clientWidth > document.body.clientWidth

      node.style.top = expandUp ? null : `${y}px`;
      node.style.bottom = expandUp ? `${document.body.clientHeight - y}px` : null;

      node.style.left = expandLeft ? null : `${x}px`;
      node.style.right = expandLeft ? `${document.body.clientWidth - x}px` : null;

      return slideFade(node, transitionOptions);
   }

   /**
    * Invokes a function on click of a menu item then fires the `close` event and automatically runs the outro
    * transition and destroys the component.
    *
    * @param {object} item - Function to invoke on click.
    */
   function onClick(item)
   {
      const callback = item?.onPress ?? item?.callback ?? item?.onClick ?? item?.onclick;

      if (typeof callback === 'function') { callback(item); }

      if (!closed)
      {
         dispatch('close');
         closed = true;
         outroAndDestroy(local);
      }
   }

   /**
    * Determines if a pointer pressed to the document body closes the context menu. If the click occurs outside the
    * context menu then fire the `close` event and run the outro transition then destroy the component.
    *
    * @param {PointerEvent|MouseEvent}  event - Pointer or mouse event from document body click / scroll wheel.
    *
    * @param {boolean}                  [isWheel=false] - True when scroll wheel; do not perform 2nd early out test.
    */
   function onClose(event, isWheel = false)
   {
      // Early out if the pointer down is inside the menu element.
      if (event.target === menuEl || menuEl.contains(event.target)) { return; }

      // Early out if the event page X / Y is the same as this context menu.
      if (!isWheel && Math.floor(event.pageX) === x && Math.floor(event.pageY) === y) { return; }

      if (!closed)
      {
         dispatch('close');
         closed = true;
         outroAndDestroy(local);
      }
   }

   /**
    * Handle key commands for closing the menu ('Esc') and reverse focus cycling via 'Shift-Tab'. Also stop propagation
    * for the key code assigned for menu item selection ('Enter').
    *
    * @param {KeyboardEvent}  event - KeyboardEvent.
    */
   function onKeydownMenu(event)
   {
      // Handle menu item keyCode selection.
      if (event.code === keyCode)
      {
         event.stopPropagation();
         return;
      }

      switch (event.code)
      {
         case 'Tab':
            event.stopPropagation();

            // Handle reverse focus cycling with `<Shift-Tab>`.
            if (event.shiftKey)
            {
               // Collect all focusable elements from `elementRoot` and ignore TJSFocusWrap.
               const allFocusable = A11yHelper.getFocusableElements(menuEl, s_IGNORE_CLASSES);

               // Find first and last focusable elements.
               const firstFocusEl = allFocusable.length > 0 ? allFocusable[0] : void 0;
               const lastFocusEl = allFocusable.length > 0 ? allFocusable[allFocusable.length - 1] : void 0;

               // Only cycle focus to the last keyboard focusable app element if `elementRoot` or first focusable
               // element is the active element.
               if (menuEl === document.activeElement || firstFocusEl === document.activeElement)
               {
                  if (lastFocusEl instanceof HTMLElement && firstFocusEl !== lastFocusEl) { lastFocusEl.focus(); }

                  event.preventDefault();
               }
            }

            break;

         default:
            // Any other key stop propagation preventing any global key handlers from responding.
            event.stopPropagation();
            break;
      }
   }

   /**
    * Handle key commands for closing the menu ('Esc') and reverse focus cycling via 'Shift-Tab'. Also stop propagation
    * for the key code assigned for menu item selection ('Enter').
    *
    * @param {KeyboardEvent}  event - KeyboardEvent.
    */
   function onKeyupMenu(event)
   {
      switch (event.code)
      {
         case 'ContextMenu':
         case 'Escape':
            event.preventDefault();
            event.stopPropagation();

            if (!closed)
            {
               closed = true;
               dispatch('close');
               outroAndDestroy(local);

               if (isObject(focusOptions))
               {
                  if (focusOptions.focusEl instanceof HTMLElement && focusOptions.focusEl.isConnected)
                  {
                     focusOptions.focusEl.focus();
                  }
               }

               // menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true, detail: { keypress: hasKeyboardFocus } }));
            }
            break;
      }
   }

   /**
    * Handle key presses on menu items.
    *
    * @param {KeyboardEvent}     event - KeyboardEvent.
    *
    * @param {TJSMenuItemData}   item - Menu item data.
    */
   function onKeyupItem(event, item)
   {
      if (event.code === keyCode)
      {
         if (!closed)
         {
            closed = true;
            dispatch('close');
            outroAndDestroy(local);

            event.preventDefault();
            event.stopPropagation();

            // menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true, detail: { keypress: hasKeyboardFocus } }));
         }

         const callback = item?.onPress ?? item?.callback ?? item?.onClick ?? item?.onclick;
         if (typeof callback === 'function') { callback(item); }
      }
   }

   /**
    * Closes context menu when browser window is blurred.
    */
   function onWindowBlur()
   {
      if (!closed)
      {
         dispatch('close');
         closed = true;
         outroAndDestroy(local);
      }
   }
</script>

<!-- bind to `document.body` to receive pointer down & scroll wheel events to close the context menu. -->
<svelte:body on:pointerdown={onClose} on:wheel={(event) => onClose(event, true)}/>

<!-- bind to 'window' to close context menu when browser window is blurred. -->
<svelte:window on:blur={onWindowBlur}/>

<nav id={id}
     class=tjs-context-menu
     bind:this={menuEl}
     on:click|preventDefault|stopPropagation={() => null}
     on:keydown={onKeydownMenu}
     on:keyup={onKeyupMenu}
     style:z-index={zIndex}
     transition:animate
     use:applyStyles={styles}
     tabindex=-1>
    <ol class=tjs-context-menu-items>
        <slot name="before"/>
        {#each items as item}
            <li class=tjs-context-menu-item
                on:click|preventDefault|stopPropagation={() => onClick(item)}
                on:keyup={(event) => onKeyupItem(event, item)}
                role=menuitem
                tabindex=0>
                <span class=tjs-context-menu-focus-indicator />
                <i class={item.icon}></i>{localize(item.label)}
            </li>
        {/each}
        <slot name="after"/>
    </ol>
    <TJSFocusWrap elementRoot={menuEl} />
</nav>

<style>
    .tjs-context-menu {
        position: fixed;
        width: fit-content;
        height: max-content;
        overflow: hidden;

        min-width: 20px;
        max-width: 360px;

        font-size: 14px;
        box-shadow: 0 0 10px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));
        background: var(--typhonjs-color-content-window, #23221d);
        border: 1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));
        border-radius: 5px;
        color: var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));
        text-align: start;
    }

    .tjs-context-menu:focus-visible {
        outline: 2px solid transparent;
    }

    .tjs-context-menu-items {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .tjs-context-menu-item {
        display: flex;
        align-items: center;
        gap: 0.25em;
        line-height: 2em;
        padding: 0 0.5em 0 0;
    }

    /* Disable default outline for focus visible / within */
    .tjs-context-menu-item:focus-within, .tjs-context-menu-item:focus-visible {
        outline: none;
    }

    .tjs-context-menu-item:focus-visible .tjs-context-menu-focus-indicator {
        background: var(--tjs-context-menu-focus-indicator-color, var(--tjs-default-color-focus, white));
    }

    /* Enable focus indicator for focus-within */
    /* Note: the use of `has` pseudo-selector that requires a child with :focus-visible */
    .tjs-context-menu-item:focus-within:has(:focus-visible) .tjs-context-menu-focus-indicator {
        background: var(--tjs-context-menu-focus-indicator-color, var(--tjs-default-color-focus, white));
    }

    /* Fallback for browsers that don't support 'has'; any user interaction including mouse will trigger */
    @supports not (selector(:has(*))) {
        .tjs-context-menu-item:focus-within .tjs-context-menu-focus-indicator {
            background: var(--tjs-context-menu-focus-indicator-color, var(--tjs-default-color-focus, white));
        }
    }

    .tjs-context-menu-item i {
        text-align: center;
        width: 1.25em;
    }

    .tjs-context-menu-item:hover {
        color: var(--tjs-context-menu-item-color-focus-hover, var(--tjs-default-color-focus-hover, #fff));
        text-shadow: var(--tjs-context-menu-item-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, 0 0 8px red));
    }

    .tjs-context-menu-item:focus-visible {
        color: var(--tjs-context-menu-item-color-focus-hover, #fff);
        text-shadow: var(--tjs-context-menu-item-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, 0 0 8px red));
    }

    .tjs-context-menu-focus-indicator {
        display: flex;
        align-self: stretch;
        width: var(--tjs-context-menu-focus-indicator-width, 0.25em);
    }
</style>

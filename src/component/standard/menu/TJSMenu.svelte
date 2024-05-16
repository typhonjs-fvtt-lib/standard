<script>
   /**
    * TJSMenu provides a menu component that can be slotted into toggle components like TJSToggleIconButton and
    * TJSToggleLabel.
    *
    * TJSMenu supports a flexible data driven way to construct the menu items. Depending on the item data that is passed
    * into the menu you can define 4 types of items: 'icon / label', 'image / label', 'class / Svelte component', and
    * 'separator / hr'. TJSMenu also accepts a main slot allowing the entire menu contents to be replaced with a custom
    * component as well as named slots `before` and `after` which place named components before or after the main menu
    * data driven items.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Exported props include:
    *
    * - `menu` ({@link TJSMenuData}): An object defining all properties of a menu including potentially data driven
    * minimal Svelte configuration objects (`slotAfter`, `slotBefore`, and `slotDefault`) providing default
    * component implementations.
    *
    * Or in lieu of passing the folder object you can assign these props directly:
    * - `items`: An iterable list of {@link TJSMenuItemData}; defines data driven menu items.
    *
    * - `offset`: Optional X / Y offsets for the menu display.
    *
    * - `styles`: Styles to be applied inline via `applyStyles` action.
    *
    * - `efx`: Currently unused; for any future action effects.
    *
    * - `keyCode`: The key code to activate menu items.
    *
    * - `transitionOptions`: Custom transition options for duration and easing function.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * ### Events
    *
    * There is a single that is fired and bubbled up through parent elements:
    *
    * - `close:popup` - A CustomEvent fired when the menu closes allowing any parent components to update state. The
    *                 `detail` data may have two optional fields of data including `keyboardFocus` / boolean if the
    *                  close action originated from keyboard navigation and the other is `target` / HTMLElement that is
    *                  the original event target for the close action.
    *
    * ----------------------------------------------------------------------------------------------------------------
    *
    * ### Styling
    * To style this component use `.tjs-menu` as the base selector.
    *
    * There are several local CSS variables that you can use to change the appearance dynamically. Either use
    * CSS props or pass in a `styles` object w/ key / value props to set to the details. The default fallback variables
    * target both TJSMenu and TJSContextMenu. The few `popup` defaults target first level overlaid components inside an
    * application.
    *
    * ### CSS Variables
    * ```
    * The following CSS variables are supported, but not defined by default:
    *
    * --tjs-menu-background - fallback: --tjs-default-menu-background; fallback: --tjs-default-popup-background; default: #23221d
    * --tjs-menu-border - fallback: --tjs-default-popup-border; default: 1px solid #000
    * --tjs-menu-border-radius - fallback: --tjs-default-popup-border-radius; default: 5px
    * --tjs-menu-box-shadow - fallback: --tjs-default-popup-box-shadow; default: 0 0 2px #000
    * --tjs-menu-primary-color - fallback: --tjs-default-menu-primary-color; fallback: --tjs-default-popup-primary-color; default: #b5b3a4
    * --tjs-menu-max-width - fallback: --tjs-default-menu-max-width; default: 360px
    * --tjs-menu-min-width - fallback: --tjs-default-menu-min-width; default: 20px
    * --tjs-menu-z-index - fallback: --tjs-default-popup-z-index; default: 100
    *
    * The following CSS variables define attributes for the data driven menu items.
    *
    * All menu items:
    * --tjs-menu-item-line-height - fallback: --tjs-default-menu-item-line-height; default: 2em
    * --tjs-menu-item-padding - fallback: --tjs-default-menu-item-padding; default: 0 0.5em 0 0
    *
    * Icon / Image menu items (considered a button item):
    * --tjs-menu-item-button-gap - fallback: --tjs-default-menu-item-button-gap; default: 0.25em
    * --tjs-menu-item-highlight-color - fallback: --tjs-default-menu-highlight-color; fallback: --tjs-default-popup-highlight-color; default: #f0f0e0
    * --tjs-menu-item-text-shadow-focus-hover - fallback: --tjs-default-text-shadow-focus-hover; default: 0 0 8px red
    *
    * Specific targeting for the label of button items (allows control of wrapping / set `white-space` to `nowrap`):
    * --tjs-menu-item-label-overflow - fallback: --tjs-default-menu-item-label-overflow; default: hidden
    * --tjs-menu-item-label-text-overflow - fallback: --tjs-default-menu-item-label-text-overflow; default: ellipsis
    * --tjs-menu-item-label-white-space - fallback: --tjs-default-menu-item-label-white-space; default: undefined
    *
    * Icon menu item:
    * --tjs-menu-item-icon-width - fallback: --tjs-default-menu-item-icon-width; default: 1.25em
    *
    * Image menu item:
    * --tjs-menu-item-image-width - fallback: --tjs-default-menu-item-image-width; default: 1.25em
    * --tjs-menu-item-image-height - fallback: --tjs-default-menu-item-image-height; default: 1.25em
    *
    * Separator / HR:
    * --tjs-menu-hr-margin - fallback: --tjs-default-hr-margin; default: 0 0.25em
    * --tjs-menu-hr-border-top - fallback: --tjs-default-hr-border-top; default: 1px solid #555
    * --tjs-menu-hr-border-bottom - fallback: --tjs-default-hr-border-bottom; default: 1px solid #444
    *
    * The following CSS variables define the keyboard / a11y focus indicator for menu items:
    * --tjs-menu-focus-indicator-align-self - fallback: --tjs-default-focus-indicator-align-self; default: stretch
    * --tjs-menu-focus-indicator-background - fallback: --tjs-default-focus-indicator-background; default: white
    * --tjs-menu-focus-indicator-border - fallback: --tjs-default-focus-indicator-border; default: undefined
    * --tjs-menu-focus-indicator-border-radius - fallback: --tjs-default-focus-indicator-border-radius; default: 0.1em
    * --tjs-menu-focus-indicator-height - fallback: --tjs-default-focus-indicator-height; default: undefined
    * --tjs-menu-focus-indicator-width - fallback: --tjs-default-focus-indicator-width; default: 0.25em
    * --tjs-menu-focus-indicator-transition - fallback: --tjs-default-focus-indicator-transition
    * ```
    * @componentDocumentation
    */

   import {
      getContext,
      onDestroy,
      onMount }               from '#svelte';

   import { applyStyles }     from '#runtime/svelte/action/dom';
   import { localize }        from '#runtime/svelte/helper';
   import { slideFade }       from '#runtime/svelte/transition';

   import { TJSSvelteUtil }   from '#runtime/svelte/util';

   import {
      getStackingContext,
      A11yHelper }            from '#runtime/util/browser';

   import {
      isIterable,
      isObject }              from '#runtime/util/object';

   import { TJSFocusWrap }    from '#runtime/svelte/component/core';

   /** @type {import('.').TJSMenuData} */
   export let menu = void 0;

   /** @type {Iterable<import('.').TJSMenuItemData>} */
   export let items = void 0;

   /** @type {HTMLElement|string} */
   export let focusEl = void 0;

   /** @type {{ x?: number, y?: number }} */
   export let offset = void 0;

   /** @type {Record<string, string>} */
   export let styles = void 0;

   /** @type {Function} */
   export let efx = void 0;

   /** @type {string} */
   export let keyCode = void 0;

   /** @type {{ duration: number, easing: Function }} */
   export let transitionOptions = void 0;

   const s_DEFAULT_OFFSET = { x: 0, y: 0 };

   // Provides options to `A11yHelper.getFocusableElements` to ignore TJSFocusWrap by CSS class.
   const s_IGNORE_CLASSES = { ignoreClasses: ['tjs-focus-wrap'] };

   /**
    * @type {Window} The current external application active Window / WindowProxy or `globalThis`.
    *
    * Supports registering to the active window / document body for when an underlying application is popped out in a
    * unique browser window. If not found default to `globalThis`.
    */
   const activeWindow = getContext('#external')?.application?.reactive?.activeWindow ?? globalThis;

   /** @type {Iterable<import('./index').TJSMenuItemData>} */
   let allItems;

   $: {
      const tempList = isObject(menu) && isIterable(menu.items) ? menu.items :
       isIterable(items) ? items : [];

      const tempItems = [];

      let cntr = -1;

      for (const item of tempList)
      {
         cntr++;
         if (!isObject(item)) { throw new TypeError(`TJSMenu error: 'item[${cntr}]' is not an object.`); }

         // Filter items for any condition that prevents display.
         if (typeof item.condition === 'function' && !item.condition()) { continue; }
         if (typeof item.condition === 'boolean' && !item.condition) { continue; }

         let type;

         if (TJSSvelteUtil.isComponent(item.class)) { type = 'class'; }
         else if (typeof item.icon === 'string') { type = 'icon'; }
         else if (typeof item.image === 'string') { type = 'image'; }
         else if (item.icon === void 0 && item.image === void 0 && typeof item.label === 'string') { type = 'label'; }
         else if (typeof item.separator === 'string')
         {
            if (item.separator !== 'hr')
            {
               throw new Error (
                `TJSMenu error: 'item[${cntr}]' has unknown separator type; only 'hr' is currently supported.`)
            }

            type = 'separator-hr';
         }

         if (type === void 0) { throw new TypeError(`TJSMenu error: Unknown type for 'item[${cntr}]'.`); }

         tempItems.push({ ...item, '#type': type });
      }

      allItems = tempItems;
   }

   $: focusEl = isObject(menu) && A11yHelper.isFocusSource(menu.focusEl) ? menu.focusEl :
    A11yHelper.isFocusSource(focusEl) ? focusEl : void 0;

   $: offset = isObject(menu) && isObject(menu.offset) ? menu.offset :
    isObject(offset) ? offset : s_DEFAULT_OFFSET;

   $: styles = isObject(menu) && isObject(menu.styles) ? menu.styles :
    isObject(styles) ? styles : void 0;

   $: efx = isObject(menu) && typeof menu.efx === 'function' ? menu.efx :
    typeof efx === 'function' ? efx : () => {};

   $: keyCode = isObject(menu) && typeof menu.keyCode === 'string' ? menu.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: transitionOptions = isObject(menu) && isObject(menu.transitionOptions) ? menu.transitionOptions :
     isObject(transitionOptions) ? transitionOptions : { duration: 200, easing: 'quintOut' };

   // Bound to the nav element / menu.
   let menuEl;

   // Stores if this context menu is closed.
   let closed = false;

   // Stores any associated `focusSource` options to pass to menu callbacks when menu was activated by keys.
   /** @type {import('#runtime/util/browser').A11yFocusSource} */
   let focusSource = void 0;

   // Stores if menu has keyboard focus; detected on mount, when tab navigation occurs, and used to set `keyboardFocus`
   // for close event.
   let hasKeyboardFocus = false;

   // ----------------------------------------------------------------------------------------------------------------

   // Event bindings
   // Bind to `document.body` to receive pointer down & scroll wheel events to close the context menu.
   // Bind to 'window' to close context menu when browser window is blurred.

   onDestroy(() =>
   {
      // To support cases when the active window may be a popped out browser register directly.
      activeWindow.document.body.removeEventListener('pointerdown', onClose);
      activeWindow.document.body.removeEventListener('wheel', onClose);
      activeWindow.removeEventListener('blur', onWindowBlur);
   });

   onMount(() =>
   {
      // To support cases when the active window may be a popped out browser unregister directly.
      activeWindow.document.body.addEventListener('pointerdown', onClose);
      activeWindow.document.body.addEventListener('wheel', onClose);
      activeWindow.addEventListener('blur', onWindowBlur);

      /** @type {HTMLElement} */
      const activeEl = activeWindow.document.activeElement;

      /** @type {HTMLElement} */
      const parentEl = menuEl.parentElement;

      // Determine if the parent element to the menu contains the active element and that it is explicitly focused
      // via `:focus-visible` / keyboard navigation. If so then explicitly focus the first menu item possible.
      if (parentEl instanceof HTMLElement && activeEl instanceof HTMLElement && parentEl.contains(activeEl) &&
        activeEl.matches(':focus-visible'))
      {
         const firstFocusEl = A11yHelper.getFirstFocusableElement(menuEl);

         if (firstFocusEl instanceof HTMLElement && !firstFocusEl.classList.contains('tjs-focus-wrap'))
         {
            firstFocusEl.focus();
            hasKeyboardFocus = true;
         }
         else
         {
            // Silently focus the menu element so that keyboard handling functions.
            menuEl.focus();
         }

         // Menu opened by keyboard navigation; set focus source to activeEl and pass to menu item callbacks.
         focusSource = {
            focusEl: [activeEl]
         };

         // Append any optional focus source from `focusEl` prop.
         if (focusEl) { focusSource.focusEl.push(focusEl); }
      }
      else
      {
         // Silently focus the menu element so that keyboard handling functions.
         menuEl.focus();

         // Create focus source from optional `focusEl` prop.
         if (focusEl)
         {
            focusSource = {
               focusEl: [focusEl]
            };
         }
      }
   });

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Provides a custom transform allowing inspection of the element to change positioning styles based on the
    * height / width of the element and the containing stacking context element. This allows the menu to expand left or
    * right when the menu exceeds the bounds of the containing stacking context element.
    *
    * @param {HTMLElement} node - nav element.
    *
    * @returns {object} Transition object.
    */
   function animate(node)
   {
      const result = getStackingContext(node.parentElement, activeWindow);
      if (!result?.node)
      {
         console.warn(`'TJSMenu.animate warning: Could not locate parent stacking context element.`);
         return;
      }

      const stackingContextRect = result?.node.getBoundingClientRect();
      const stackingContextRight = stackingContextRect.x + stackingContextRect.width;

      const nodeRect = node.getBoundingClientRect();
      const parentRect = node.parentElement.getBoundingClientRect();

      const adjustedOffset = {...s_DEFAULT_OFFSET, ...offset};

      node.style.top = `${adjustedOffset.y + parentRect.height}px`;

      // Check to make sure that the menu width does not exceed the right side of the stacking context element.
      // If not open to the right.
      if (parentRect.x + nodeRect.width < stackingContextRight)
      {
         node.style.left = `${adjustedOffset.x}px`;
         node.style.removeProperty('right');
      }
      else // Open left.
      {
         node.style.right = `${adjustedOffset.x}px`;
         node.style.removeProperty('left');
      }

      return slideFade(node, transitionOptions);
   }

   /**
    * Invokes a function on click of a menu item then fires the `close` event and automatically runs the outro
    * transition and destroys the component.
    *
    * @param {PointerEvent}    event - PointerEvent.
    *
    * @param {import('./index').TJSMenuItemData} [item] - Menu item data.
    */
   function onClick(event, item)
   {
      if (typeof item?.onPress === 'function') { item.onPress({ event, item, focusSource }); }

      if (!closed)
      {
         closed = true;
         menuEl.dispatchEvent(new CustomEvent('close:popup', { bubbles: true, cancelable: true }));
      }
   }

   /**
    * Determines if a pointer event is pressed outside the menu which closes the menu. Use a bubbling custom event
    * `close:popup` and attach the original target. The TRL application shells will respond to this event to handle
    * any additional automatic focus management.
    *
    * @param {PointerEvent}   event - Pointer event from document body click.
    */
   async function onClose(event)
   {
      // Early out if the pointer down is inside the menu element.
      if (event.target === menuEl || menuEl.contains(event.target)) { return; }

      if (event.target === menuEl.parentElement || menuEl.parentElement.contains(event.target)) { return; }

      if (!closed)
      {
         closed = true;

         menuEl.dispatchEvent(new CustomEvent('close:popup', {
            bubbles: true,
            cancelable: true,
            detail: { target: event.target }
         }));
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

      switch(event.code)
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
               if (menuEl === activeWindow.document.activeElement ||
                firstFocusEl === activeWindow.document.activeElement)
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
         case 'Escape':
            if (!closed)
            {
               closed = true;
               menuEl.dispatchEvent(new CustomEvent('close:popup',
                { bubbles: true, cancelable: true, detail: { keyboardFocus: hasKeyboardFocus } }));
            }

            event.preventDefault();
            event.stopPropagation();
            break;
      }
   }

   /**
    * Handle key presses on menu items.
    *
    * @param {KeyboardEvent}     event - KeyboardEvent.
    *
    * @param {import('./index').TJSMenuItemData}   [item] - Menu item data.
    */
   function onKeyupItem(event, item)
   {
      if (event.code === keyCode)
      {
         if (typeof item?.onPress === 'function') { item.onPress({ event, item, focusSource }); }

         if (!closed)
         {
            closed = true;

            event.preventDefault();
            event.stopPropagation();

            menuEl.dispatchEvent(new CustomEvent('close:popup',
             { bubbles: true, cancelable: true, detail: { keyboardFocus: hasKeyboardFocus } }));
         }
      }
   }

   /**
    * Closes menu when browser window is blurred.
    */
   function onWindowBlur()
   {
      if (!closed)
      {
         closed = true;
         menuEl.dispatchEvent(new CustomEvent('close:popup', { bubbles: true, cancelable: true }));
      }
   }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<nav class=tjs-menu
     bind:this={menuEl}
     on:click|preventDefault|stopPropagation={() => null}
     on:keydown|stopPropagation={onKeydownMenu}
     on:keyup|preventDefault|stopPropagation={onKeyupMenu}
     on:pointerdown|stopPropagation={() => null}
     on:pointerup|stopPropagation={() => null}
     transition:animate|global
     use:applyStyles={styles}
     use:efx
     tabindex=-1
   >

   <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
   <ol class=tjs-menu-items role=menu>
      <!-- TJSMenu supports hosting a slot for menu content -->
      <slot>
         {#if TJSSvelteUtil.isComponent(menu?.slotDefault?.class)}
            <svelte:component this={menu.slotDefault.class} {...(isObject(menu?.slotDefault?.props) ? menu.slotDefault.props : {})} />
         {/if}
      </slot>

      {#if $$slots.before}
         <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
         <li class=tjs-menu-item
             on:click={(event) => onClick(event)}
             on:keyup={(event) => onKeyupItem(event)}
             role=menuitem
             tabindex=0>
            <span class=tjs-menu-focus-indicator />
            <slot name=before>
               {#if TJSSvelteUtil.isComponent(menu?.slotBefore?.class)}
                  <svelte:component this={menu.slotBefore.class} {...(isObject(menu?.slotBefore?.props) ? menu.slotBefore.props : {})} />
               {/if}
            </slot>
         </li>
      {/if}
      {#each allItems as item}
         {#if item['#type'] === 'class'}
            <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
            <li class=tjs-menu-item
                on:click={(event) => onClick(event, item)}
                on:keyup={(event) => onKeyupItem(event, item)}
                role=menuitem
                tabindex=0>
               <span class=tjs-menu-focus-indicator />
               <svelte:component this={item.class} {...(isObject(item.props) ? item.props : {})} />
            </li>
         {:else if item['#type'] === 'icon'}
            <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
            <li class="tjs-menu-item tjs-menu-item-button"
                 on:click={(event) => onClick(event, item)}
                 on:keyup={(event) => onKeyupItem(event, item)}
                 role=menuitem
                 tabindex=0>
               <span class=tjs-menu-focus-indicator />
               <i class={item.icon}></i>
               <span class=tjs-menu-item-label>{localize(item.label)}</span>
            </li>
         {:else if item['#type'] === 'image'}
            <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
            <li class="tjs-menu-item tjs-menu-item-button"
                 on:click={(event) => onClick(event, item)}
                 on:keyup={(event) => onKeyupItem(event, item)}
                 role=menuitem
                 tabindex=0>
               <span class=tjs-menu-focus-indicator />
               <img src={item.image} alt={item.imageAlt}>
               <span class=tjs-menu-item-label>{localize(item.label)}</span>
            </li>
         {:else if item['#type'] === 'label'}
            <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
            <li class="tjs-menu-item tjs-menu-item-button"
                on:click={(event) => onClick(event, item)}
                on:keyup={(event) => onKeyupItem(event, item)}
                role=menuitem
                tabindex=0>
               <span class=tjs-menu-focus-indicator />
               <span class=tjs-menu-item-label>{localize(item.label)}</span>
            </li>
         {:else if item['#type'] === 'separator-hr'}
            <hr>
         {/if}
      {/each}
      {#if $$slots.after}
         <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
         <li class=tjs-menu-item
             on:click={(event) => onClick(event)}
             on:keyup={(event) => onKeyupItem(event)}
             role=menuitem
             tabindex=0>
            <span class=tjs-menu-focus-indicator />
            <slot name=after>
               {#if TJSSvelteUtil.isComponent(menu?.slotAfter?.class)}
                  <svelte:component this={menu.slotAfter.class} {...(isObject(menu?.slotAfter?.props) ? menu.slotAfter.props : {})} />
               {/if}
            </slot>
         </li>
      {/if}
   </ol>
   <TJSFocusWrap elementRoot={menuEl} />
</nav>

<style>
   .tjs-menu {
      position: absolute;
      width: max-content;
      height: max-content;

      background: var(--tjs-menu-background, var(--tjs-default-menu-background, var(--tjs-default-popup-background, #23221d)));
      border: var(--tjs-menu-border, var(--tjs-default-popup-border, 1px solid #000));
      border-radius: var(--tjs-menu-border-radius, var(--tjs-default-popup-border-radius, 5px));
      box-shadow: var(--tjs-menu-box-shadow, var(--tjs-default-popup-box-shadow, 0 0 2px #000));
      color: var(--tjs-menu-primary-color, var(--tjs-default-menu-primary-color, var(--tjs-default-popup-primary-color, #b5b3a4)));
      max-width: var(--tjs-menu-max-width, var(--tjs-default-menu-max-width, 360px));
      min-width: var(--tjs-menu-min-width, var(--tjs-default-menu-min-width, 20px));

      text-align: start;

      /* Defines z-index in local stacking context */
      z-index: var(--tjs-menu-z-index, var(--tjs-default-popup-z-index, 100));
   }

   .tjs-menu:focus-visible {
      outline: var(--tjs-default-a11y-outline-focus-visible, 2px solid transparent);
   }

   .tjs-menu-items {
      margin: 0;
      padding: 0;
   }

   .tjs-menu-items hr {
      margin-block-start: 0;
      margin-block-end: 0;
      margin: var(--tjs-menu-hr-margin, var(--tjs-default-hr-margin, 0 0.25em));
      border-top: var(--tjs-menu-hr-border-top, var(--tjs-default-hr-border-top, 1px solid #555));
      border-bottom: var(--tjs-menu-hr-border-bottom, var(--tjs-default-hr-border-bottom, 1px solid #444));
   }

   .tjs-menu-item {
      display: flex;
      align-items: center;
      line-height: var(--tjs-menu-item-line-height, var(--tjs-default-menu-item-line-height, 2em));
      padding: var(--tjs-menu-item-padding, var(--tjs-default-menu-item-padding, 0 0.5em 0 0));
   }

   /* Disable default outline for focus visible / within */
   .tjs-menu-item:focus-within, .tjs-menu-item:focus-visible {
      outline: none;
   }

   .tjs-menu-item i {
      text-align: center;
      width: var(--tjs-menu-item-icon-width, var(--tjs-default-menu-item-icon-width, 1.25em));
   }

   .tjs-menu-item img {
      width: var(--tjs-menu-item-image-width, var(--tjs-default-menu-item-image-width, 1.25em));
      height: var(--tjs-menu-item-image-height, var(--tjs-default-menu-item-image-height, 1.25em));
   }

   .tjs-menu-item-button {
      gap: var(--tjs-menu-item-button-gap, var(--tjs-default-menu-item-button-gap, 0.25em));
   }

   .tjs-menu-item-button:hover {
      color: var(--tjs-menu-item-highlight-color, var(--tjs-default-menu-highlight-color, var(--tjs-default-popup-highlight-color, #f0f0e0)));
      text-shadow: var(--tjs-menu-item-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, 0 0 8px red));
   }

   .tjs-menu-item-button:focus-visible {
      color: var(--tjs-menu-item-highlight-color, var(--tjs-default-menu-highlight-color, var(--tjs-default-popup-highlight-color, #f0f0e0)));
      text-shadow: var(--tjs-menu-item-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, 0 0 8px red));
   }

   .tjs-menu-focus-indicator {
      align-self: var(--tjs-menu-focus-indicator-align-self, var(--tjs-default-focus-indicator-align-self, stretch));
      border: var(--tjs-menu-focus-indicator-border, var(--tjs-default-focus-indicator-border));
      border-radius: var(--tjs-menu-focus-indicator-border-radius, var(--tjs-default-focus-indicator-border-radius, 0.1em));
      height: var(--tjs-menu-focus-indicator-height, var(--tjs-default-focus-indicator-height));
      width: var(--tjs-menu-focus-indicator-width, var(--tjs-default-focus-indicator-width, 0.25em));
      transition: var(--tjs-menu-focus-indicator-transition, var(--tjs-default-focus-indicator-transition));
   }

   /* Enable focus indicator for focus-within */
   /* Note: the use of `has` pseudo-selector that requires a child with :focus-visible */
   .tjs-menu-item:focus-within:has(:focus-visible) .tjs-menu-focus-indicator {
      background: var(--tjs-menu-focus-indicator-background, var(--tjs-default-focus-indicator-background, white));
   }

   /* Fallback for browsers that don't support 'has'; any user interaction including mouse will trigger */
   @supports not (selector(:has(*))) {
      .tjs-menu-item:focus-within .tjs-menu-focus-indicator {
         background: var(--tjs-menu-focus-indicator-background, var(--tjs-default-focus-indicator-background, white));
      }
   }

   /* Enable focus indicator for focus visible */
   .tjs-menu-item:focus-visible .tjs-menu-focus-indicator {
      background: var(--tjs-menu-focus-indicator-background, var(--tjs-default-focus-indicator-background, white));
   }

   .tjs-menu-item-label {
      overflow: var(--tjs-menu-item-label-overflow, var(--tjs-default-menu-item-label-overflow, hidden));
      text-overflow: var(--tjs-menu-item-label-text-overflow, var(--tjs-default-menu-item-label-text-overflow, ellipsis));
      white-space: var(--tjs-menu-item-label-white-space, var(--tjs-default-menu-item-label-white-space));
   }
</style>

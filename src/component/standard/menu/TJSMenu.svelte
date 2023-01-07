<script>
   /**
    * --tjs-menu-background - fallback: --tjs-comp-popup-background; default: #23221d
    * --tjs-menu-border - fallback: --tjs-comp-popup-border; default: 1px solid #000
    * --tjs-menu-box-shadow - fallback: --tjs-comp-popup-box-shadow; default: 0 0 2px #000
    * --tjs-menu-color - fallback: --tjs-comp-popup-color; default: #eee
    * --tjs-menu-z-index - fallback: --tjs-comp-popup-z-index; default: 100
    *
    * --tjs-menu-focus-indicator-color - fallback: --tjs-default-color-focus; default: white
    * --tjs-menu-hr-border-bottom - fallback: --tjs-default-hr-border-bottom; default: 1px solid #555
    * --tjs-menu-hr-border-top - fallback: --tjs-default-hr-border-top; default: 1px solid #444
    * --tjs-menu-item-color-focus-hover - fallback: --tjs-default-color-focus-hover; default: #fff
    * --tjs-menu-item-text-shadow-focus-hover - fallback: --tjs-anchor-text-shadow-focus-hover; default: red
    */

   import { onMount }      from 'svelte';

   import { quintOut }     from 'svelte/easing';

   import { localize }     from '@typhonjs-svelte/lib/helper';
   import { slideFade }    from '@typhonjs-svelte/lib/transition';
   import {
      A11yHelper,
      getStackingContext,
      isIterable,
      isObject,
      isSvelteComponent }  from '@typhonjs-svelte/lib/util';

   import { TJSFocusWrap } from '@typhonjs-fvtt/svelte/component/core';

   const s_DEFAULT_OFFSET = { x: 0, y: 0 };

   // Provides options to `A11yHelper.getFocusableElements` to ignore TJSFocusWrap by CSS class.
   const s_IGNORE_CLASSES = { ignoreClasses: ['tjs-focus-wrap'] };

   /** @type {TJSMenuData} */
   export let menu = void 0;

   /** @type {Iterable<TJSMenuItemData>} */
   export let items = void 0;

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

   /** @type {Iterable<TJSMenuItemData>} */
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

         if (isSvelteComponent(item.class)) { type = 'class'; }
         else if (typeof item.icon === 'string') { type = 'icon'; }
         else if (typeof item.image === 'string') { type = 'image'; }
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

   $: offset = isObject(menu) && isObject(menu.offset) ? menu.offset :
    isObject(offset) ? offset : s_DEFAULT_OFFSET;

   $: styles = isObject(menu) && isObject(menu.styles) ? menu.styles :
    isObject(styles) ? styles : void 0;

   $: efx = isObject(menu) && typeof menu.efx === 'function' ? menu.efx :
    typeof efx === 'function' ? efx : () => {};

   $: keyCode = isObject(menu) && typeof menu.keyCode === 'string' ? menu.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: transitionOptions = isObject(menu) && isObject(menu.transitionOptions) ? menu.transitionOptions :
     isObject(transitionOptions) ? transitionOptions : { duration: 200, easing: quintOut };

   // Bound to the nav element / menu.
   let menuEl;

   // Stores if this context menu is closed.
   let closed = false;

   // ----------------------------------------------------------------------------------------------------------------

   onMount(() =>
   {
      const activeEl = document.activeElement;
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
      const result = getStackingContext(node.parentElement);

      if (!(result?.node instanceof HTMLElement))
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
    * @param {TJSMenuItemData} [item] - Menu item data.
    */
   function onClick(item)
   {
      const callback = item?.onPress ?? item?.callback ?? item?.onClick ?? item?.onclick;

      if (typeof callback === 'function') { callback(item); }

      if (!closed)
      {
         closed = true;
         menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true }));
      }
   }

   /**
    * Determines if a pointer pressed to the document body closes the menu. If the click occurs outside the
    * menu then fire the `close` event and run the outro transition then destroy the component.
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
         menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true }));
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
         case 'Escape':
            if (!closed)
            {
               closed = true;
               menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true, detail: { keypress: true } }));
            }

            event.preventDefault();
            event.stopPropagation();
            break;

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
         const callback = item?.onPress ?? item?.onClick ?? item?.onclick;

         if (typeof callback === 'function') { callback(item); }

         if (!closed)
         {
            closed = true;

            event.preventDefault();
            event.stopPropagation();

            menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true, detail: { keypress: true } }));
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
         menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true }));
      }
   }
</script>

<!-- bind to `document.body` to receive pointer down & scroll wheel events to close the menu. -->
<svelte:body on:pointerdown={onClose} on:wheel={onClose}/>

<!-- bind to 'window' to close menu when browser window is blurred. -->
<svelte:window on:blur={onWindowBlur}/>

<nav class=tjs-menu
     bind:this={menuEl}
     transition:animate
     use:efx
     on:keydown={onKeydownMenu}
     tabindex=-1
   >
   <section class=tjs-menu-items>
      <!-- TJSMenu supports hosting a slot for menu content -->
      <slot />

      {#if $$slots.before}
         <div class=tjs-menu-item>
            <span class=tjs-menu-focus-indicator />
            <slot name=before />
         </div>
      {/if}
      {#each allItems as item}
         {#if item['#type'] === 'class'}
            <div class=tjs-menu-item on:click|preventDefault|stopPropagation={onClick} role=presentation>
               <span class=tjs-menu-focus-indicator />
               <svelte:component this={item.class} {...(isObject(item.props) ? item.props : {})} />
            </div>
         {:else if item['#type'] === 'icon'}
            <div class="tjs-menu-item tjs-menu-item-button"
                 on:click|preventDefault|stopPropagation={() => onClick(item)}
                 on:keyup|preventDefault|stopPropagation={(event) => onKeyupItem(event, item)}
                 role=button
                 tabindex=0>
               <span class=tjs-menu-focus-indicator />
               <i class={item.icon}></i>{localize(item.label)}
            </div>
         {:else if item['#type'] === 'image'}
            <div class="tjs-menu-item tjs-menu-item-button"
                 on:click|preventDefault|stopPropagation={() => onClick(item)}
                 on:keyup|preventDefault|stopPropagation={(event) => onKeyupItem(event, item)}
                 role=button
                 tabindex=0>
               <span class=tjs-menu-focus-indicator />
               <img src={item.image} alt={item.imageAlt}>{localize(item.label)}
            </div>
         {:else if item['#type'] === 'separator-hr'}
            <hr>
         {/if}
      {/each}
      {#if $$slots.after}
         <div class=tjs-menu-item>
            <span class=tjs-menu-focus-indicator />
            <slot name=after />
         </div>
      {/if}
   </section>
   <TJSFocusWrap elementRoot={menuEl} />
</nav>

<style>
   .tjs-menu {
      position: absolute;
      width: max-content;
      height: max-content;
      overflow: hidden;

      background: var(--tjs-menu-background, var(--tjs-comp-popup-background, #23221d));
      border: var(--tjs-menu-border, var(--tjs-comp-popup-border, 1px solid #000));
      border-radius: var(--tjs-menu-border-radius, var(--tjs-comp-popup-border-radius, 5px));
      box-shadow: var(--tjs-menu-box-shadow, var(--tjs-comp-popup-box-shadow, 0 0 2px #000));
      color: var(--tjs-menu-color, var(--tjs-comp-popup-color, #eee));

      text-align: start;

      z-index: var(--tjs-menu-z-index, var(--tjs-comp-popup-z-index, 100));
   }

   .tjs-menu:focus-visible {
      outline: 2px solid transparent;
   }

   .tjs-menu-items {
      margin: 0;
      padding: 0;
   }

   .tjs-menu-items hr {
      margin-block-start: 0;
      margin-block-end: 0;
      margin: 0 0.25em;
      border-top: var(--tjs-menu-hr-border-top, var(--tjs-default-hr-border-top, 1px solid #555));
      border-bottom: var(--tjs-menu-hr-border-bottom, var(--tjs-default-hr-border-bottom, 1px solid #444));
   }

   .tjs-menu-item {
      display: flex;
      align-items: center;
      padding: 0 0.5em 0 0;
      line-height: 2em;
   }

   /* Disable default outline for focus visible / within */
   .tjs-menu-item:focus-within, .tjs-menu-item:focus-visible {
      outline: none;
   }

   /* Enable focus indicator for focus-within */
   /* Note: the use of `has` pseudo-selector that requires a child with :focus-visible */
   .tjs-menu-item:focus-within:has(:focus-visible) .tjs-menu-focus-indicator {
      background: var(--tjs-menu-focus-indicator-color, var(--tjs-default-color-focus, white));
   }

   /* Fallback for browsers that don't support 'has'; any user interaction including mouse will trigger */
   @supports not (selector(:has(*))) {
      .tjs-menu-item:focus-within .tjs-menu-focus-indicator {
         background: var(--tjs-menu-focus-indicator-color, var(--tjs-default-color-focus, white));
      }
   }

   /* Enable focus indicator for focus visible */
   .tjs-menu-item:focus-visible .tjs-menu-focus-indicator {
      background: var(--tjs-menu-focus-indicator-color, var(--tjs-default-color-focus, white));
   }

   .tjs-menu-focus-indicator {
      display: flex;
      align-self: stretch;
      width: 0.25em;
   }

   .tjs-menu-item i {
      text-align: center;
      width: 1.25em;
   }

   .tjs-menu-item img {
      width: 1.25em;
      height: 1.25em;
   }

   .tjs-menu-item-button {
      display: flex;
      gap: 0.25em;
   }

   .tjs-menu-item-button:hover {
      color: var(--tjs-menu-item-color-focus-hover, var(--tjs-default-color-focus-hover, #fff));
      text-shadow: var(--tjs-menu-item-text-shadow-focus-hover, var(--tjs-anchor-text-shadow-focus-hover, 0 0 8px red));
   }

   .tjs-menu-item-button:focus-visible {
      color: var(--tjs-menu-item-color-focus-hover, #fff);
      text-shadow: var(--tjs-menu-item-text-shadow-focus-hover, var(--tjs-anchor-text-shadow-focus-hover, 0 0 8px red));
   }
</style>

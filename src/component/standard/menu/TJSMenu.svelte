<script>
   /**
    * --tjs-menu-background - #23221d
    * --tjs-menu-border - 1px solid #000
    * --tjs-menu-box-shadow - 0 0 2px #000
    * --tjs-menu-color - #EEE
    * --tjs-menu-hr-border-bottom - 1px solid #555
    * --tjs-menu-hr-border-top - 1px solid #444
    * --tjs-menu-item-hover-color - #FFF
    * --tjs-menu-item-hover-text-shadow-color - red
    * --tjs-menu-z-index - 100
    */

   import { onMount }      from 'svelte';

   import { quintOut }     from 'svelte/easing';

   import { localize }     from '@typhonjs-svelte/lib/helper';
   import { slideFade }    from '@typhonjs-svelte/lib/transition';
   import {
      getStackingContext,
      isIterable,
      isObject,
      isSvelteComponent }  from '@typhonjs-svelte/lib/util';

   const s_DEFAULT_OFFSET = { x: 0, y: 0 };

   export let menu = void 0;
   export let items = void 0;
   export let offset = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let keyCode = void 0;
   export let transitionOptions = void 0;

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

   onMount(() => menuEl.focus());

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
    * @param {object} [item] - Item object to find on click callback function.
    */
   function onClick(item)
   {
      const callback = item?.onClick ?? item?.onclick;

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
            break;

         default:
            event.preventDefault();
            event.stopPropagation();
            break;
      }
   }

   function onKeyupItem(event, item)
   {
      if (event.code === keyCode)
      {
         const callback = item?.onClick ?? item?.onclick;

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
<!--<svelte:window on:blur={onWindowBlur}/>-->

<nav class=tjs-menu
     bind:this={menuEl}
     transition:animate
     use:efx
     on:click|preventDefault|stopPropagation={() => null}
     on:keydown={onKeydownMenu}
     on:wheel|preventDefault|stopPropagation={() => null}
     tabindex=-1
   >
   <section class=tjs-menu-items>
      <div on:click|preventDefault|stopPropagation={onClick} role=presentation>
         <slot />
      </div>
      <slot name=before />
      {#each allItems as item}
         {#if item['#type'] === 'class'}
            <div class=tjs-menu-item on:click|preventDefault|stopPropagation={onClick} role=presentation>
               <svelte:component this={item.class} />
            </div>
         {:else if item['#type'] === 'icon'}
            <div class="tjs-menu-item tjs-menu-item-button"
                 on:click|preventDefault|stopPropagation={() => onClick(item)}
                 on:keyup|preventDefault|stopPropagation={(event) => onKeyupItem(event, item)}
                 role=button
                 tabindex=0>
               <i class={item.icon}></i>{localize(item.label)}
            </div>
         {:else if item['#type'] === 'image'}
            <div class="tjs-menu-item tjs-menu-item-button"
                 on:click|preventDefault|stopPropagation={() => onClick(item)}
                 on:keyup|preventDefault|stopPropagation={(event) => onKeyupItem(event, item)}
                 role=button
                 tabindex=0>
               <img src={item.image} alt={item.alt}>{localize(item.label)}
            </div>
         {:else if item['#type'] === 'separator-hr'}
            <hr>
         {/if}
      {/each}
      <slot name=after />
   </section>
</nav>

<style>
   .tjs-menu {
      position: absolute;
      width: max-content;
      height: max-content;

      background: var(--tjs-menu-background, #23221d);
      border: var(--tjs-menu-border, 1px solid #000);
      border-radius: var(--tjs-menu-border-radius, 5px);
      box-shadow: var(--tjs-menu-box-shadow, 0 0 2px #000);
      color: var(--tjs-menu-color, #EEE);

      text-align: start;

      z-index: var(--tjs-menu-z-index, 100);
   }

   .tjs-menu section.tjs-menu-items {
      margin: 0;
      padding: 0;
   }

   .tjs-menu div.tjs-menu-item {
      display: flex;
      align-items: center;
      padding: 0 0.5em;
      line-height: 2em;
   }

   .tjs-menu section.tjs-menu-items hr {
      margin-block-start: 0;
      margin-block-end: 0;
      margin: 0.5em 0.25em;
      border-top: var(--tjs-menu-hr-border-top, 1px solid #555);
      border-bottom: var(--tjs-menu-hr-border-bottom, 1px solid #444);
   }

   .tjs-menu .tjs-menu-item i {
      text-align: center;
      width: 1.25em;
   }

   .tjs-menu .tjs-menu-item img {
      width: 1.25em;
      height: 1.25em;
   }

   .tjs-menu-item-button {
      display: flex;
      gap: 0.25em;
   }

   .tjs-menu-item-button:hover {
      color: var(--tjs-menu-item-hover-color, #FFF);
      text-shadow: var(--tjs-menu-item-text-shadow-focus-hover, var(--tjs-anchor-text-shadow-focus-hover, 0 0 8px red));
   }

   .tjs-menu-item-button:focus-visible {
      color: var(--tjs-menu-item-hover-color, #FFF);
      text-shadow: var(--tjs-menu-item-text-shadow-focus-hover, var(--tjs-anchor-text-shadow-focus-hover, 0 0 8px red));
   }
</style>

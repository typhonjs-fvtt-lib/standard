<script>
   import { quintOut }           from 'svelte/easing';

   import { localize }           from '@typhonjs-svelte/lib/helper';
   import { slideFade }          from '@typhonjs-svelte/lib/transition';
   import { getStackingContext } from '@typhonjs-svelte/lib/util';

   const s_DEFAULT_OFFSET = { x: 0, y: 0 };

   export let menu;
   export let items;
   export let offset;
   export let styles;
   export let efx;
   export let transitionOptions;

   $: {
      const allItems = typeof menu === 'object' && Array.isArray(menu.items) ? menu.items :
       Array.isArray(items) ? items : [];

      // Filter items for any condition that prevents display.
      items = allItems.filter((item) => item.condition === void 0 ? true :
       typeof item.condition === 'function' ? item.condition() : item.condition);
   }

   $: offset = typeof menu === 'object' && typeof menu.offset === 'object' ? menu.offset :
    typeof offset === 'object' ? offset : s_DEFAULT_OFFSET;
   $: styles = typeof menu === 'object' && typeof menu.styles === 'object' ? menu.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof menu === 'object' && typeof menu.efx === 'function' ? menu.efx :
    typeof efx === 'function' ? efx : () => {};
   $: transitionOptions =
    typeof menu === 'object' && typeof menu.transitionOptions === 'object' ? menu.transitionOptions :
     typeof transitionOptions === 'object' ? transitionOptions : { duration: 200, easing: quintOut };

   // Bound to the nav element / menu.
   let menuEl;

   // Stores if this context menu is closed.
   let closed = false;

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
    * @param {function} callback - Function to invoke on click.
    */
   function onClick(callback)
   {
      if (typeof callback === 'function')
      { callback(); }

      if (!closed)
      {
         menuEl.dispatchEvent(new CustomEvent('close', { bubbles: true }));
         closed = true;
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
     on:click|preventDefault|stopPropagation={() => null}
     on:wheel|preventDefault|stopPropagation={() => null}>
   <ol class=tjs-menu-items>
      <slot name="before"/>
      {#each items as item}
         <li class=tjs-menu-item on:click|preventDefault|stopPropagation={() => onClick(item.onclick)}>
            <i class={item.icon}></i>{localize(item.label)}
         </li>
      {/each}
      <slot name="after"/>
   </ol>
</nav>

<style>
   .tjs-menu {
      position: absolute;
      width: max-content;
      height: max-content;

      /* TODO: Finalize CSS variables; these are not final! */
      box-shadow: 0 0 2px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));
      background: var(--typhonjs-color-content-window, #23221d);
      border: 1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));
      border-radius: 5px;
      color: var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));

      text-align: start;

      z-index: 1; /* TODO: make configurable */
   }

   .tjs-menu ol.tjs-menu-items {
      list-style: none;
      margin: 0;
      padding: 0;
   }

   .tjs-menu li.tjs-menu-item {
      padding: 0 0.5em;
      line-height: 2em;
   }

   .tjs-menu li.tjs-menu-item:hover {
      color: var(--typhonjs-color-text-primary, #FFF);
      text-shadow: 0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red));
   }

   .tjs-menu li.tjs-menu-item > i {
      width: 1em;
      margin-right: 5px;
   }
</style>

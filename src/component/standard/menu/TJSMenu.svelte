<script>
   import {
      getContext
   }                    from 'svelte';
   import { quintOut }  from 'svelte/easing';

   import { localize }  from '@typhonjs-svelte/lib/helper';
   import { slideFade } from '@typhonjs-svelte/lib/transition';

   const s_DEFAULT_OFFSET = { x: 0, y: 0 };

   export let menu;
   export let items;
   export let offset;
   export let styles;
   export let efx;
   export let transitionOptions;

   $: items = typeof menu === 'object' && Array.isArray(menu.items) ? menu.items :
    Array.isArray(items) ? items : [];
   $: offset = typeof menu === 'object' && typeof menu.offset === 'object' ? menu.offset :
    typeof offset === 'object' ? offset : s_DEFAULT_OFFSET;
   $: styles = typeof menu === 'object' && typeof menu.styles === 'object' ? menu.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof menu === 'object' && typeof menu.efx === 'function' ? menu.efx :
    typeof efx === 'function' ? efx : () => {};
   $: transitionOptions =
    typeof menu === 'object' && typeof menu.transitionOptions === 'object' ? menu.transitionOptions :
     typeof transitionOptions === 'object' ? transitionOptions : { duration: 200, easing: quintOut };

   const storeElementRoot = getContext('storeElementRoot');

   // Bound to the nav element / menu.
   let menuEl;

   // Stores if this context menu is closed.
   let closed = false;

   /**
    * Provides a custom transform allowing inspection of the element to change positioning styles based on the
    * height / width of the element and the containing `element root`. This allows the menu to expand left or right when
    * the menu exceeds the bounds of the containing `element root`.
    *
    * @param {HTMLElement} node - nav element.
    *
    * @returns {object} Transition object.
    */
   function animate(node)
   {
      const elementRoot = $storeElementRoot;
      if (!elementRoot) { return; }

      const elementRootRect = elementRoot.getBoundingClientRect();
      const elementRootRight = elementRootRect.x + elementRootRect.width;

      const nodeRect = node.getBoundingClientRect();
      const parentRect = node.parentElement.getBoundingClientRect();

      const parentRight = parentRect.x + parentRect.width;

      const adjustedOffset = {...s_DEFAULT_OFFSET, ...offset};

      node.style.top = `${adjustedOffset.y + parentRect.top + parentRect.height - elementRootRect.top}px`;

      // Check to make sure that the menu width does not exceed the right side of the element root. If not open right.
      if (parentRect.x + nodeRect.width < elementRootRight)
      {
         node.style.left = `${adjustedOffset.x + parentRect.x - elementRootRect.x}px`;
         node.style.removeProperty('right');
      }
      else // Open left.
      {
         node.style.right = `${elementRootRight - parentRight}px`;
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
         menuEl.dispatchEvent(new CustomEvent('close', {bubbles: true}));
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
         menuEl.dispatchEvent(new CustomEvent('close', {bubbles: true}));
      }
   }
</script>

<!-- bind to `document.body` to receive pointer down events to close the context menu. -->
<svelte:body on:pointerdown={onClose}/>

<nav class=tjs-menu
     bind:this={menuEl}
     transition:animate
     use:efx>
   <ol class=tjs-menu-items>
      {#each items as item}
         <li class=tjs-menu-item on:click={() => onClick(item.onclick)}>
            <i class={item.icon}></i>{localize(item.label)}
         </li>
      {/each}
   </ol>
</nav>

<style>
   .tjs-menu {
      position: absolute;
      width: fit-content;
      height: max-content;

      box-shadow: 0 0 2px var(--color-shadow-dark, var(--typhonjs-color-shadow, #000));
      background: var(--typhonjs-color-content-window, #23221d);
      border: 1px solid var(--color-border-dark, var(--typhonjs-color-border, #000));
      border-radius: 5px;
      color: var(--color-text-light-primary, var(--typhonjs-color-text-secondary, #EEE));
   }

   .tjs-menu ol.tjs-menu-items {
      list-style: none;
      margin: 0;
      padding: 0;
   }

   .tjs-menu li.tjs-menu-item {
      padding: 0 5px;
      line-height: 32px;
   }

   .tjs-menu li.tjs-menu-item:hover {
      color: var(--typhonjs-color-text-primary, #FFF);
      text-shadow: 0 0 4px var(--color-text-hyperlink, var(--typhonjs-color-accent-tertiary, red));
   }

   .tjs-menu li.tjs-menu-item > i {
      margin-right: 5px;
   }
</style>

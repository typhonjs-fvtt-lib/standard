<script>
   import { writable }  from 'svelte/store';

   import {
      applyScrolltop,
      applyStyles }     from '@typhonjs-fvtt/runtime/svelte/action';

   import {
      isObject }        from '@typhonjs-fvtt/runtime/svelte/util';

   export let container = void 0;

   /** @type {import('svelte/store').Writable<number>} */
   export let scrollTop = void 0;

   /** @type {Record<string, string>} */
   export let styles = void 0;

   $: scrollTop = isObject(container) && isObject(container.scrollTop) ? container.scrollTop :
    isObject(scrollTop) ? scrollTop : writable(0);

   $: styles = isObject(container) && isObject(container.styles) ? container.styles :
    isObject(styles) ? styles : void 0;

   /** @type {HTMLElement} */
   let containerEl;

   function onKeydown(event)
   {
      switch (event.code)
      {
         case 'PageDown':
         case 'PageUp':
         {
            const activeEl = document.activeElement;
            if (activeEl === containerEl || containerEl.contains(activeEl))
            {
               // Stop propagation against any global key handlers when focus is inside the container.
               event.stopPropagation();
            }

            break;
         }
      }
   }

   function onKeyup(event)
   {
      switch (event.code)
      {
         case 'PageDown':
         case 'PageUp':
         {
            const activeEl = document.activeElement;
            if (activeEl === containerEl || containerEl.contains(activeEl))
            {
               // Stop propagation against any global key handlers when focus is inside the container.
               event.stopPropagation();
            }

            break;
         }
      }
   }

   /**
    * Handles stopping propagation and silently focusing the container element so key commands function.
    *
    * @param {WheelEvent}  event - A WheelEvent.
    */
   function onWheel(event)
   {
      event.stopPropagation();

      const activeEl = document.activeElement;
      if (activeEl !== containerEl && !containerEl.contains(activeEl)) { containerEl.focus(); }
   }
</script>

<div class=tjs-scroll-container
     bind:this={containerEl}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     on:wheel={onWheel}
     use:applyScrolltop={scrollTop}
     use:applyStyles={styles}
     tabindex=-1
>
   <slot />
</div>

<style>
   .tjs-scroll-container {
      overflow: var(--tjs-scroll-container-overflow, auto);

      /* For Firefox */
      scrollbar-width: var(--tjs-scroll-container-scrollbar-width, thin);
      scrollbar-color: var(--tjs-scroll-container-scrollbar-color, inherit);
   }

   .tjs-scroll-container:focus-visible {
      outline: var(--tjs-scroll-container-outline-focus, var(--tjs-default-a11y-outline-focus, 2px solid transparent));
   }
</style>

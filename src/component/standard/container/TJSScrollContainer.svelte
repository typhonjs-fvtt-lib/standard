<script>
   /**
    * Provides a convenient scrollable container / DIV that always allows keyboard scroll navigation by stopping
    * propagation of page up / down key events when the active element is or is contained by the container.
    *
    * Auto serialization of scroll state is handled by providing a store / `scrollTop`.
    *
    * A main slot is provided for a content component, but a fallback allows a child content component to be defined
    * by the `class` and `props` fields in {@link TJSScrollContainerData}.
    *
    * @componentDocumentation
    */

   import { writable }        from '#svelte/store';

   import {
      applyScrolltop,
      applyStyles }           from '#runtime/svelte/action/dom';

   import { TJSSvelteUtil }   from '#runtime/svelte/util';

   import { isObject }        from '#runtime/util/object';

   /** @type {import('.').TJSScrollContainerData} */
   export let container = void 0;

   /** @type {import('svelte/store').Writable<number>} */
   export let scrollTop = void 0;

   /** @type {Record<string, string>} */
   export let styles = void 0;

   $: scrollTop = isObject(container) && isObject(container.scrollTop) ? container.scrollTop :
    isObject(scrollTop) ? scrollTop : writable(0);

   $: styles = isObject(container) && isObject(container.styles) ? container.styles :
    isObject(styles) ? styles : void 0;

   $: child = isObject(container) && TJSSvelteUtil.isComponent(container.class) ? container.class : void 0;
   $: props = isObject(container) && isObject(container.props) ? container.props : {};

   /** @type {HTMLElement} */
   let containerEl;

   /**
    * Stops propagation against any global key handlers when focus is inside the container for page up / down key
    * events.
    *
    * @param {KeyboardEvent}  event - A KeyboardEvent.
    */
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

   /**
    * Stops propagation against any global key handlers when focus is inside the container for page up / down key
    * events.
    *
    * @param {KeyboardEvent}  event - A KeyboardEvent.
    */
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
     role=presentation
     tabindex=-1
>
   <slot>
      {#if child}
         <svelte:component this={child} {...props} />
      {/if}
   </slot>
</div>

<style>
   .tjs-scroll-container {
      overflow: var(--tjs-scroll-container-overflow, auto);

      /* For Firefox */
      scrollbar-width: var(--tjs-scroll-container-scrollbar-width, thin);
      scrollbar-color: var(--tjs-scroll-container-scrollbar-color, inherit);
   }

   .tjs-scroll-container:focus-visible {
      outline: var(--tjs-scroll-container-outline-focus-visible, var(--tjs-default-a11y-outline-focus-visible, 2px solid transparent));
   }
</style>

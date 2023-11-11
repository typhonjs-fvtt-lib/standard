<script>
   import {
      getContext,
      onDestroy }          from '#svelte';

   import { slideFade }    from '#runtime/svelte/transition';
   import { A11yHelper }   from '#runtime/util/browser';
   import { isObject }     from '#runtime/util/object';

   /** @type {HTMLDivElement} */
   export let hostEl;

   /** @type {number} */
   export let duration;

   /** @type {(time: number) => number} */
   export let easingIn;

   /** @type {(time: number) => number} */
   export let easingOut;

   /** @type {{ icon: string, svelte: import('#runtime/svelte/util').TJSSvelteConfig, title?: string }} */
   export let item;

   /** @type {'left' | 'right'} */
   export let side;

   // Retrieve any host application to determine active global window. This may be undefined, so fallback to
   // `globalThis` in focus management.
   const application = getContext('#external')?.application;

   onDestroy(() =>
   {
      // This component may not be embedded in an application so fallback to `globalThis`.
      const activeWindow = application?.reactive?.activeWindow ?? globalThis;

      // Handle the case when the panel is being destroyed and focus transfers to the `document.body`; focus parent
      // container instead.
      if (activeWindow.document.activeElement === activeWindow.document.body)
      {
         hostEl?.parentElement?.focus();
      }
   })

   /**
    * Provides focus cycling inside the the host element acting on `<Shift-Tab>` and if `firstFocusEl` is
    * the actively focused element then last focusable element is focused.
    *
    * Note: When popped out to different browser window the `<Shift-Tab>` is not received when the first element is
    * focused. On Chrome focus will traverse backward to another element outside the host element. On Firefox the key
    * event is not received either, but the first focusable element stays focused.
    *
    * @param {KeyboardEvent} event - Keyboard Event.
    */
   function onKeydown(event)
   {
      if (event.code === 'Tab')
      {
         // Collect all focusable elements from `containerEl` and ignore TJSFocusWrap.
         const allFocusable = A11yHelper.getFocusableElements(hostEl, { ignoreElements: new Set() });

         // Find first and last focusable elements.
         const firstFocusEl = allFocusable.length > 0 ? allFocusable[0] : void 0;
         const lastFocusEl = allFocusable.length > 0 ? allFocusable[allFocusable.length - 1] : void 0;

         // This component may not be embedded in an application so fallback to `globalThis`.
         const activeWindow = application?.reactive?.activeWindow ?? globalThis;

         if (event.shiftKey)
         {
            if (firstFocusEl === activeWindow.document.activeElement)
            {
               if (lastFocusEl && firstFocusEl !== lastFocusEl) { lastFocusEl.focus(); }

               event.preventDefault();
               event.stopPropagation();
            }
         }
         else
         {
            if (lastFocusEl === activeWindow.document.activeElement)
            {
               if (firstFocusEl && firstFocusEl !== lastFocusEl) { firstFocusEl.focus(); }

               event.preventDefault();
               event.stopPropagation();
            }
         }
      }
   }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div bind:this={hostEl}
     class=tjs-side-slide-layer-item-host
     class:left={side === 'left'}
     class:right={side === 'right'}
     on:keydown={onKeydown}
     in:slideFade={{ axis: 'x', duration, easingSlide: easingIn }}
     out:slideFade={{ axis: 'x', duration, easingSlide: easingOut }}>
   <svelte:component this={item.svelte.class} {...(isObject(item.svelte.props) ? item.svelte.props : {})} />
</div>

<style>
   .tjs-side-slide-layer-item-host {
      position: absolute;
      pointer-events: all;
      width: fit-content;
      height: fit-content;

      padding: var(--tjs-side-slide-layer-item-host-padding, 10px);

      background: var(--tjs-side-slide-layer-item-host-background, linear-gradient(135deg, rgba(52, 51, 52, 0.9) 10%, rgba(15, 14, 28, 0.9) 90%));
      border: var(--tjs-side-slide-layer-item-host-border, solid 2px black);
      box-shadow: var(--tjs-side-slide-layer-item-host-box-shadow, var(--tjs-side-slide-layer-item-box-shadow, rgba(0, 0, 0, 0.35) 0px 5px 15px));
      color: var(--tjs-side-slide-layer-item-host-color, white);

      transition: var(--tjs-side-slide-layer-item-transition, all 200ms ease-in-out)
   }

   .tjs-side-slide-layer-item-host.left {
      left: calc(var(--tjs-side-slide-layer-item-diameter, 30px) + 2px);
      border-radius: var(--tjs-side-slide-layer-item-host-border-radius-left, 5% 10% 20% 5%);
   }

   .tjs-side-slide-layer-item-host.right {
      right: calc(var(--tjs-side-slide-layer-item-diameter, 30px) + 2px);
      border-radius: var(--tjs-side-slide-layer-item-host-border-radius-right, 5% 5% 10% 20%);
   }
</style>

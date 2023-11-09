<script>
   import { getContext }         from '#svelte';

   import { TJSFocusWrap }       from '#runtime/svelte/component/core';
   import { localize }           from '#runtime/svelte/helper';
   import { slideFade }          from '#runtime/svelte/transition';
   import { isTJSSvelteConfig }  from '#runtime/svelte/util';
   import { A11yHelper }         from '#runtime/util/browser';
   import { isObject }           from '#runtime/util/object';

   /**
    * Duration of transition effect.
    *
    * @type {number}
    */
   export let duration = 200;

   /**
    * Svelte easing function.
    *
    * @type {(time: number) => number}
    */
   export let inEasing = void 0;

   /**
    * Svelte easing function.
    *
    * @type {(time: number) => number}
    */
   export let outEasing = void 0;

   /**
    * The side slide item icon (Font awesome string) and a Svelte configuration object.
    *
    * @type {{ icon: string, svelte: import('#runtime/svelte/util').TJSSvelteConfig, title?: string }}
    */
   export let item = void 0;

   /**
    * The side in layers parent element to display.
    *
    * @type {'left' | 'right'}
    */
   export let side = void 0;

   /**
    * Always keeps the side panel items open / prevents closure. This is a development flag allowing you to use HMR
    * to develop your side item panel without the need to constantly activate the panel.
    */
   export let stayOpen = false;

   // Provides options to `A11yHelper.getFocusableElements` to ignore TJSFocusWrap by CSS class.
   const s_FOCUS_IGNORE_CLASSES = { ignoreClasses: ['tjs-focus-wrap'] };

   // Provides a store for all items to share and use to increment the item container z-index when pointer enters the
   // item icon. This allows each item that is being shown to always be on top regardless of item order.
   const storeZIndex = getContext('#side-slide-layer-item-z-index');

   // Retrieve any host application to determine active global window. This may be undefined, so fallback to
   // `globalThis` in focus management.
   const application = getContext('#external')?.application;

   // Flip the hover state to false whenever stayOpen is false.
   $: if (!stayOpen) { setHoverFalse(); }

   $: if (panelEl)
   {
      // console.log(`!!! TJSSideSlideItem - panelEl defined - item.icon: `, item.icon)
      containerEl.focus();
   }

   /**
    * Tracks current hover state over icon & panel.
    *
    * @type {boolean}
    */
   let hover = false;

   /** @type {HTMLDivElement} */
   let containerEl, iconEl, panelEl;

   /**
    * Handles the case when the `Escape` key is pressed and the pointer hasn't left the containing item. A click
    * reopens the panel.
    *
    * @param {MouseEvent}  event - MouseEvent.
    */
   function onClick(event)
   {
      event.preventDefault();
      event.stopPropagation();

      if (!hover) { hover = true; }
   }

   /**
    * Provides focus cycling inside the application capturing `<Shift-Tab>` and if `elementRoot` or `firstFocusEl` is
    * the actively focused element then last focusable element is focused skipping `TJSFocusWrap`.
    *
    * Also, if a popout app all key down events will bring this application to the top such that when focus is trapped
    * the app is top most.
    *
    * @param {KeyboardEvent} event - Keyboard Event.
    */
   function onKeydown(event)
   {
      if (event.shiftKey && event.code === 'Tab')
      {
         // Collect all focusable elements from `containerEl` and ignore TJSFocusWrap.
         const allFocusable = A11yHelper.getFocusableElements(containerEl, s_FOCUS_IGNORE_CLASSES);

         // Find first and last focusable elements.
         const firstFocusEl = allFocusable.length > 0 ? allFocusable[0] : void 0;
         const lastFocusEl = allFocusable.length > 0 ? allFocusable[allFocusable.length - 1] : void 0;

         // This component may not be embedded in an application so fallback to `globalThis`.
         const activeWindow = application?.reactive?.activeWindow ?? globalThis;

         // console.log(`!!! TJSSideSlideItem - onKeydown - Shift-Tab - A - firstFocusEl: `, firstFocusEl);
         // console.log(`!!! TJSSideSlideItem - onKeydown - Shift-Tab - B - lastFocusEl: `, lastFocusEl);

         // Only cycle focus to the last keyboard focusable app element if `elementRoot` or first focusable element
         // is the active element.
         if (firstFocusEl === activeWindow.document.activeElement)
         {
            if (lastFocusEl instanceof HTMLElement && firstFocusEl !== lastFocusEl) { lastFocusEl.focus(); }

            event.preventDefault();
            event.stopPropagation();
         }
      }

      // Close the panel if hovering / open.
      if (event.code === 'Escape')
      {
         event.preventDefault();
         event.stopPropagation();

         setHoverFalse();
      }
   }

   /**
    * Triggered when the pointer enters the item icon. Increments the z-index of the item container to always show on
    * top of any existing open items.
    */
   function onPointerenter()
   {
      containerEl.style.zIndex = `${$storeZIndex++}`;

      hover = true;
   }

   /**
    * After a small delay when the pointer leaves the item container only set `hover` to false if both `panelEl` and
    * `itemEl` do not have the `:hover` style property. This will keep the panel open when the pointer / mouse travels
    * from the item icon to the panel itself.
    */
   function onPointerleave()
   {
      setTimeout(() =>
      {
         if (!panelEl?.matches(':hover') && !iconEl.matches(':hover')) { setHoverFalse(); }
      }, 80);
   }

   /**
    * Invoked when the panel is about to be closed. This allows focus management to handle the case when the active
    * focus is inside the closing panel. Doing nothing in this case will result in `document.body` receiving focus.
    * The goal is to focus the containingEl / item button.
    */
   function setHoverFalse()
   {
      if (stayOpen) { return; }

      if (hover) { hover = false; }
   }
</script>

<div bind:this={containerEl}
     class=tjs-side-slide-layer-item-container
     class:left={side === 'left'}
     class:right={side === 'right'}
     on:click={onClick}
     on:keydown={onKeydown}
     on:pointerleave={onPointerleave}
     tabindex=0>

   {#if hover && isTJSSvelteConfig(item.svelte)}
      <div bind:this={panelEl}
           class=tjs-side-slide-layer-item-host
           in:slideFade={{ axis: 'x', duration, easingSlide: inEasing }}
           out:slideFade={{ axis: 'x', duration, easingSlide: outEasing }}>
         <svelte:component this={item.svelte.class} {...(isObject(item.svelte.props) ? item.svelte.props : {})} />
         <TJSFocusWrap elementRoot={panelEl} />
      </div>
   {/if}

   <div bind:this={iconEl}
        class=tjs-side-slide-layer-item
        title={localize(item.title)}
        on:pointerenter={onPointerenter}>
      <i class={item.icon}></i>
   </div>
</div>

<style>
   .tjs-side-slide-layer-item-container:focus-visible {
      box-shadow: var(--tjs-side-slide-layer-item-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
      outline: var(--tjs-side-slide-layer-item-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
      transition: var(--tjs-side-slide-layer-item-transition-focus-visible, var(--tjs-default-transition-focus-visible));
   }

   .tjs-side-slide-layer-item-container:hover .tjs-side-slide-layer-item {
      border-color: var(--tjs-side-slide-layer-item-border-color-hover, red);
      color: var(--tjs-side-slide-layer-item-color-hover, rgba(255, 255, 255, 0.9));

      transition: var(--tjs-side-slide-layer-item-transition, all 200ms ease-in-out);
   }

   .tjs-side-slide-layer-item-container.left, .tjs-side-slide-layer-item-container.left .tjs-side-slide-layer-item {
      border-radius: var(--tjs-side-slide-layer-item-border-radius-left, 20% 20% 50% 30%);
   }

   .tjs-side-slide-layer-item-container.right, .tjs-side-slide-layer-item-container.right .tjs-side-slide-layer-item {
      border-radius: var(--tjs-side-slide-layer-item-border-radius-right, 20% 30% 20% 50%);
   }

   .tjs-side-slide-layer-item-container.left .tjs-side-slide-layer-item-host {
      left: calc(var(--tjs-side-slide-layer-item-diameter, 30px) + 2px);
      border-radius: var(--tjs-side-slide-layer-item-host-border-radius-left, 5% 10% 30% 5%);
   }

   .tjs-side-slide-layer-item-container.right .tjs-side-slide-layer-item-host {
      right: calc(var(--tjs-side-slide-layer-item-diameter, 30px) + 2px);
      border-radius: var(--tjs-side-slide-layer-item-host-border-radius-right, 5% 5% 10% 30%);
   }

   .tjs-side-slide-layer-item {
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
      transition: var(--tjs-side-slide-layer-item-transition, all 200ms ease-in-out);

      background: var(--tjs-side-slide-layer-item-background, rgba(0, 0, 0, 0.3));
      border: var(--tjs-side-slide-layer-item-border, solid 2px black);
      box-shadow: var(--tjs-side-slide-layer-item-box-shadow, rgba(0, 0, 0, 0.35) 0px 5px 15px);
      color: var(--tjs-side-slide-layer-item-color, rgba(255, 255, 255, 0.7));
      font-size: var(--tjs-side-slide-layer-item-font-size, 14px);

      width: var(--tjs-side-slide-layer-item-diameter, 30px);
      height: var(--tjs-side-slide-layer-item-diameter, 30px);
   }

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
   }
</style>

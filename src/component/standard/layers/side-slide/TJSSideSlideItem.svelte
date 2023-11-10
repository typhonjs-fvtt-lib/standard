<script>
   import { getContext }         from '#svelte';

   import { localize }           from '#runtime/svelte/helper';
   import { isTJSSvelteConfig }  from '#runtime/svelte/util';

   import TJSSideSlideItemHost   from './TJSSideSlideItemHost.svelte';

   /** @type {number} */
   export let duration = 200;

   /** @type {(time: number) => number} */
   export let inEasing = void 0;

   /** @type {(time: number) => number} */
   export let outEasing = void 0;

   /**
    * The side slide item icon (Font awesome string) and a Svelte configuration object.
    *
    * @type {{ icon: string, svelte: import('#runtime/svelte/util').TJSSvelteConfig, title?: string }}
    */
   export let item = void 0;

   /** @type {'left' | 'right'} */
   export let side = void 0;

   /**
    * Always keeps the side panel items open / prevents closure. This is a development flag allowing you to use HMR
    * to develop your side item panel without the need to constantly activate the panel.
    */
   export let stayOpen = false;

   // Provides a store for all items to share and use to increment the item container z-index when pointer enters the
   // item icon. This allows each item that is being shown to always be on top regardless of item order.
   const storeZIndex = getContext('#side-slide-layer-item-z-index');

   // Flip the opened state to false whenever stayOpen is false.
   $: if (!stayOpen) { setOpened(false); }

   /**
    * Tracks current opened state over icon & panel.
    *
    * @type {boolean}
    */
   let opened = false;

   /** @type {HTMLButtonElement} */
   let buttonEl;

   /** @type {HTMLDivElement} */
   let containerEl;

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

      setOpened(true);
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
      // Close the panel if hovering / open.
      if (event.code === 'Escape')
      {
         event.preventDefault();
         event.stopPropagation();

         setOpened(false);

         // Focus container so that keyboard navigation continues w/ the button on next `tab` press.
         containerEl.focus();
      }
   }

   /**
    * Triggered when the pointer enters the item icon. Increments the z-index of the item container to always show on
    * top of any existing open items.
    */
   function onPointerenter()
   {
      setOpened(true);
   }

   /**
    * After a small delay when the pointer leaves the item container only set opened to false if the container does not
    * have the `:hover` style property. This will keep the host panel open when the pointer / mouse travels from the
    * item icon to the panel itself.
    */
   function onPointerleave()
   {
      setTimeout(() =>
      {
         if (!containerEl.matches(':hover')) { setOpened(false); }
      }, 80);
   }

   /**
    * Adjusts panel host open state.
    *
    * @param {boolean} state - New opened state.
    */
   function setOpened(state)
   {
      if (opened === state) { return; }

      if (state)
      {
         // Increment the z-index of the container to make it always on top.
         containerEl.style.zIndex = `${$storeZIndex++}`;
         containerEl.focus();

         opened = true;
      }
      else
      {
         // Reject changing state if `stayOpen` is true.
         if (stayOpen) { return; }

         opened = false;
      }
   }
</script>

<div bind:this={containerEl}
     class=tjs-side-slide-layer-item-container
     class:left={side === 'left'}
     class:right={side === 'right'}
     class:opened={opened}
     on:keydown={onKeydown}
     on:pointerleave={onPointerleave}
     tabindex=-1>

   {#if opened && isTJSSvelteConfig(item.svelte)}
      <TJSSideSlideItemHost {duration} {item} {inEasing} {outEasing} {side} />
   {/if}

   <button bind:this={buttonEl}
           class=tjs-side-slide-layer-item
           title={localize(item.title)}
           on:click={onClick}
           on:pointerenter={onPointerenter}>
      <i class={item.icon}></i>
   </button>
</div>

<style>
   .tjs-side-slide-layer-item-container:focus-visible {
      outline: none;
   }

   .tjs-side-slide-layer-item-container.opened .tjs-side-slide-layer-item {
      border-color: var(--tjs-side-slide-layer-item-border-color-hover, red);
      color: var(--tjs-side-slide-layer-item-color-hover, rgba(255, 255, 255, 0.9));
   }

   .tjs-side-slide-layer-item-container.left, .tjs-side-slide-layer-item-container.left .tjs-side-slide-layer-item {
      border-radius: var(--tjs-side-slide-layer-item-border-radius-left, 20% 20% 50% 30%);
   }

   .tjs-side-slide-layer-item-container.right, .tjs-side-slide-layer-item-container.right .tjs-side-slide-layer-item {
      border-radius: var(--tjs-side-slide-layer-item-border-radius-right, 20% 30% 20% 50%);
   }

   .tjs-side-slide-layer-item {
      appearance: none;
      margin: 0;

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

   .tjs-side-slide-layer-item:focus-visible {
      outline: var(--tjs-side-slide-layer-item-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
      transition: var(--tjs-side-slide-layer-item-transition-focus-visible, var(--tjs-default-transition-focus-visible));
   }

   i {
      margin: 0;
      padding: 0;
   }
</style>

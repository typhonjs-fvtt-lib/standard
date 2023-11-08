<script>
   import { getContext }         from '#svelte';

   import { slideFade }          from '#runtime/svelte/transition';

   import { isTJSSvelteConfig }  from '#runtime/svelte/util';
   import { isObject }           from '#runtime/util/object';

   /**
    * Duration of transition effect.
    *
    * @type {number}
    */
   export let duration = 200;

   /**
    * The side slide item icon (Font awesome string) and a Svelte configuration object.
    *
    * @type {{ icon: string, svelte: import('#runtime/svelte/util').TJSSvelteConfig }}
    */
   export let item = void 0;

   /**
    * The side in layers parent element to display.
    *
    * @type {'left' | 'right'}
    */
   export let side = void 0;

   // Provides a store for all items to share and use to increment the item container z-index when pointer enters the
   // item icon. This allows each item that is being shown to always be on top regardless of item order.
   const storeZIndex = getContext('#side-slide-layer-item-z-index');

   /**
    * Tracks current hover state over icon & panel.
    *
    * @type {boolean}
    */
   let hover = false;

   /** @type {HTMLDivElement} */
   let containerEl, iconEl, panelEl;

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
         if (!panelEl?.matches(':hover') && !iconEl.matches(':hover')) { hover = false; }
      }, 80);
   }
</script>

<div class=tjs-side-slide-layer-item-container
     bind:this={containerEl}
     on:pointerleave={onPointerleave}>

   {#if hover && isTJSSvelteConfig(item.svelte)}
      <div class=tjs-side-slide-layer-item-host
           bind:this={panelEl}
           class:left={side === 'left'}
           class:right={side === 'right'}
           transition:slideFade={{ axis: 'x', duration }}>
         <svelte:component this={item.svelte.class} {...(isObject(item.svelte.props) ? item.svelte.props : {})} />
      </div>
   {/if}

   <div class=tjs-side-slide-layer-item
        class:left={side === 'left'}
        class:right={side === 'right'}
        on:pointerenter={onPointerenter}
        bind:this={iconEl}>
      <i class={item.icon}></i>
   </div>
</div>

<style>
   .tjs-side-slide-layer-item-container:hover .tjs-side-slide-layer-item {
      border-color: var(--tjs-side-slide-layer-item-border-color-hover, red);
      color: var(--tjs-side-slide-layer-item-color-hover, rgba(255, 255, 255, 0.9));

      transition: var(--tjs-side-slide-layer-item-transition, all 200ms ease-in-out);
   }

   .tjs-side-slide-layer-item {
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
      transition: var(--tjs-side-slide-layer-item-transition, all 200ms ease-in-out);

      background: var(--tjs-side-slide-layer-item-background, rgba(0, 0, 0, 0.3));
      border: var(--tjs-side-slide-layer-item-border, solid 2px black);
      color: var(--tjs-side-slide-layer-item-color, rgba(255, 255, 255, 0.7));
      font-size: var(--tjs-side-slide-layer-item-font-size, 14px);

      width: var(--tjs-side-slide-layer-item-diameter);
      height: var(--tjs-side-slide-layer-item-diameter);
   }

   .tjs-side-slide-layer-item.left {
      border-radius: var(--tjs-side-slide-layer-item-border-radius-left, 20% 20% 50% 30%);
   }

   .tjs-side-slide-layer-item.right {
      border-radius: var(--tjs-side-slide-layer-item-border-radius-right, 20% 30% 20% 50%);
   }

   .tjs-side-slide-layer-item-host {
      position: absolute;
      pointer-events: all;
      width: fit-content;
      height: fit-content;

      background: var(--tjs-side-slide-layer-item-host-background, linear-gradient(135deg, rgba(52, 51, 52, 0.9) 10%, rgba(15, 14, 28, 0.9) 90%));
      padding: var(--tjs-side-slide-layer-item-host-padding, 10px);

      color: var(--tjs-side-slide-layer-item-host-color, white);
      border: var(--tjs-side-slide-layer-item-host-border, solid 2px black);
   }

   .tjs-side-slide-layer-item-host.left {
      left: calc(var(--tjs-side-slide-layer-item-diameter) + 2px);
      border-radius: var(--tjs-side-slide-layer-item-host-border-radius-left, 5% 10% 30% 5%);
   }

   .tjs-side-slide-layer-item-host.right {
      right: calc(var(--tjs-side-slide-layer-item-diameter) + 2px);
      border-radius: var(--tjs-side-slide-layer-item-host-border-radius-right, 5% 5% 10% 30%);
   }
</style>

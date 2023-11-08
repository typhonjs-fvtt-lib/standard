<script>
   import { slideFade }          from '#runtime/svelte/transition';

   import { isTJSSvelteConfig }  from '#runtime/svelte/util';
   import { isObject }           from '#runtime/util/object';

   export let duration = 200;
   export let item = void 0;

   export let side = void 0;

   /**
    * Tracks current hover state over icon & panel.
    *
    * @type {boolean}
    */
   let hover = false;

   /** @type {HTMLDivElement} */
   let iconEl, panelEl;

   /**
    * After a small delay when the pointer leaves the item container check
    */
   function onPointerleave()
   {
      setTimeout(() =>
      {
         if (!panelEl?.matches(':hover') && !iconEl.matches(':hover'))
         {
            hover = false;
         }
      }, 80);
   }
</script>

<div class=tjs-side-slide-layer-item-container
     on:pointerenter={() => hover = true}
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

<script>
   /**
    * --tjs-icon-button-background
    * --tjs-icon-button-background-hover
    * --tjs-icon-button-background-selected
    * --tjs-icon-button-border-radius
    * --tjs-icon-button-clip-path
    * --tjs-icon-button-clip-path-hover
    * --tjs-icon-button-clip-path-selected
    * --tjs-icon-button-diameter
    * --tjs-icon-button-transition
    */
   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { isWritableStore } from '@typhonjs-svelte/lib/store';
   import { localize }        from '@typhonjs-svelte/lib/helper';

   export let button;
   export let icon;
   export let title;
   export let store;
   export let styles;
   export let efx;

   $: icon = typeof button === 'object' && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : '';
   $: title = typeof button === 'object' && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: store = typeof button === 'object' && isWritableStore(button.store) ? button.store : isWritableStore(store) ?
    store : void 0;
   $: styles = typeof button === 'object' && typeof button.styles === 'object' ? button.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof button === 'object' && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};

   let selected = false;

   $: if (store) { selected = $store; }

   function onClick()
   {
      selected = !selected;
      if (store) { store.set(selected); }
   }

   /**
    * Handles `close` event from any children elements.
    */
   function onClose()
   {
      selected = false;
      if (store) { store.set(false); }
   }
</script>

<div on:close on:close|preventDefault|stopPropagation={onClose} use:applyStyles={styles}>
   <a on:click on:click={onClick} use:efx class:selected>
      <i class={icon} class:selected title={localize(title)}></i>
   </a>
   {#if selected}
      <slot/>
   {/if}
</div>

<style>
   div {
      display: block;
      flex: 0 0 var(--tjs-icon-button-diameter);
      height: var(--tjs-icon-button-diameter);
      width: var(--tjs-icon-button-diameter);
      align-self: center;
      text-align: center;
   }

   a {
      display: inline-block;
      background: var(--tjs-icon-button-background);
      border-radius: var(--tjs-icon-button-border-radius);
      position: relative;
      overflow: hidden;
      clip-path: var(--tjs-icon-button-clip-path, none);
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
      transition: var(--tjs-icon-button-transition);
   }

   a:hover {
      background: var(--tjs-icon-button-background-hover);
      clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, none));
   }

   a.selected {
      background: var(--tjs-icon-button-background-selected);
      clip-path: var(--tjs-icon-button-clip-path-selected, var(--tjs-icon-button-clip-path, none));
   }

   i {
      line-height: var(--tjs-icon-button-diameter);
      transform: translateZ(1px);
   }
</style>

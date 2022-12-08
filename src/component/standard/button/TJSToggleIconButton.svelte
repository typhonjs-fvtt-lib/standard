<script>
   /**
    * --tjs-button-background
    * --tjs-button-background-hover
    * --tjs-button-background-selected
    * --tjs-button-border
    * --tjs-button-border-radius
    * --tjs-button-border-width
    * --tjs-button-clip-path
    * --tjs-button-clip-path-hover
    * --tjs-button-clip-path-selected
    * --tjs-button-diameter
    * --tjs-button-transition
    *
    * --tjs-icon-button-background
    * --tjs-icon-button-background-hover
    * --tjs-icon-button-background-selected
    * --tjs-icon-button-border
    * --tjs-icon-button-border-radius
    * --tjs-icon-button-border-width
    * --tjs-icon-button-clip-path
    * --tjs-icon-button-clip-path-hover
    * --tjs-icon-button-clip-path-selected
    * --tjs-icon-button-diameter
    * --tjs-icon-button-transition
    */
   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { isWritableStore } from '@typhonjs-svelte/lib/store';
   import { localize }        from '@typhonjs-svelte/lib/helper';

   export let button = void 0;
   export let icon = void 0;
   export let title = void 0;
   export let titleSelected = void 0;
   export let store = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let onClick = void 0;
   export let onClose = void 0;
   export let onClickPropagate = void 0;
   export let onClosePropagate = void 0;

   $: icon = typeof button === 'object' && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : '';
   $: title = typeof button === 'object' && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: titleSelected = typeof button === 'object' && typeof button.titleSelected === 'string' ? button.titleSelected :
    typeof titleSelected === 'string' ? titleSelected : '';
   $: store = typeof button === 'object' && isWritableStore(button.store) ? button.store : isWritableStore(store) ?
    store : void 0;
   $: styles = typeof button === 'object' && typeof button.styles === 'object' ? button.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof button === 'object' && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};

   $: onClick = typeof button === 'object' && typeof button.onClick === 'function' ? button.onClick :
    typeof onClick === 'function' ? onClick : void 0;
   $: onClose = typeof button === 'object' && typeof button.onClose === 'function' ? button.onClose :
    typeof onClose === 'function' ? onClose : void 0;

   $: onClosePropagate = typeof button === 'object' && typeof button.onClosePropagate === 'boolean' ? button.onClosePropagate :
    typeof onClosePropagate === 'boolean' ? onClosePropagate : false;
   $: onClickPropagate = typeof button === 'object' && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

   let selected = false;

   $: if (store) { selected = $store; }

   // Chose the current title when `selected` changes; if there is no `titleSelected` fallback to `title`.
   $: titleCurrent = selected && titleSelected !== '' ? titleSelected : title

   function onClickHandler(event)
   {
      selected = !selected;
      if (store) { store.set(selected); }

      if (typeof onClick === 'function') { onClick(selected); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * In this case we can't set pointer-events: none for the div due to the slotted component, so process clicks on the
    * div in respect to onClickPropagate.
    *
    * @param {MouseEvent} event -
    */
   function onClickDiv(event)
   {
      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Handles `close` event from any children elements.
    */
   function onCloseHandler(event)
   {
      selected = false;
      if (store) { store.set(false); }

      if (typeof onClose === 'function') { onClose(selected); }

      if (!onClosePropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div on:click={onClickDiv}
     on:close={onCloseHandler}
     title={localize(titleCurrent)}
     use:applyStyles={styles}
     role=presentation>
   <a on:click={onClickHandler} use:efx class:selected role=presentation>
      <i class={icon} class:selected></i>
   </a>
   {#if selected}
      <slot/>
   {/if}
</div>

<style>
   div {
      display: block;
      position: relative;
      flex: 0 0 var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
      height: var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
      width: var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
      align-self: center;
      text-align: center;
   }

   a {
      pointer-events: initial;
      display: inline-block;
      background: var(--tjs-icon-button-background, var(--tjs-button-background));
      border: var(--tjs-icon-button-border, var(--tjs-button-border));
      border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));
      border-width: var(--tjs-icon-button-border-width, var(--tjs-button-border-width));
      position: relative;
      overflow: hidden;
      clip-path: var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path, none));
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
      transition: var(--tjs-icon-button-transition, var(--tjs-button-transition));
   }

   a:hover {
      background: var(--tjs-icon-button-background-hover, var(--tjs-button-background-hover));
      clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-hover, none)));
   }

   a.selected {
      background: var(--tjs-icon-button-background-selected, var(--tjs-button-background-selected));
      clip-path: var(--tjs-icon-button-clip-path-selected, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-selected, none)));
   }

   i {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;

      transform: translateZ(1px);
   }
</style>

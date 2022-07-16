<script>
   /**
    * --tjs-label-background
    * --tjs-label-background-hover
    * --tjs-label-background-selected
    * --tjs-label-border-radius
    * --tjs-label-clip-path
    * --tjs-label-clip-path-hover
    * --tjs-label-clip-path-selected
    * --tjs-label-diameter
    * --tjs-label-transition
    */
   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { isWritableStore } from '@typhonjs-svelte/lib/store';
   import { localize }        from '@typhonjs-svelte/lib/helper';

   export let label;
   export let text;
   export let title;
   export let titleSelected;
   export let store;
   export let styles;
   export let efx;
   export let onClickPropagate;
   export let onClosePropagate;

   $: text = typeof label === 'object' && typeof label.text === 'string' ? label.text :
    typeof text === 'string' ? text : '';
   $: title = typeof label === 'object' && typeof label.title === 'string' ? label.title :
    typeof title === 'string' ? title : '';
   $: titleSelected = typeof label === 'object' && typeof label.titleSelected === 'string' ? label.titleSelected :
    typeof titleSelected === 'string' ? titleSelected : '';
   $: store = typeof label === 'object' && isWritableStore(label.store) ? label.store : isWritableStore(store) ?
    store : void 0;
   $: styles = typeof label === 'object' && typeof label.styles === 'object' ? label.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof label === 'object' && typeof label.efx === 'function' ? label.efx :
    typeof efx === 'function' ? efx : () => {};

   $: onClosePropagate = typeof label === 'object' && typeof label.onClosePropagate === 'boolean' ? label.onClosePropagate :
    typeof onClosePropagate === 'boolean' ? onClosePropagate : true;
   $: onClickPropagate = typeof label === 'object' && typeof label.onClickPropagate === 'boolean' ? label.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : true;

   let selected = false;

   $: if (store) { selected = $store; }

   // Chose the current title when `selected` changes; if there is no `titleSelected` fallback to `title`.
   $: titleCurrent = selected && titleSelected !== '' ? titleSelected : title

   function onClick(event)
   {
      selected = !selected;
      if (store) { store.set(selected); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Handles `close` event from any children elements.
    */
   function onClose(event)
   {
      selected = false;
      if (store) { store.set(false); }

      if (!onClosePropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div on:close on:click
     on:close={onClose}
     title={localize(titleCurrent)}
     use:applyStyles={styles}>
   <span on:click={onClick} use:efx class:selected>
      <slot name=left />{localize(text)}<slot name=right />
   </span>
   {#if selected}
      <slot/>
   {/if}
</div>

<style>
   div {
      display: block;
      position: relative;
      /*flex: 0 0 var(--tjs-label-diameter);*/
      /*height: var(--tjs-label-diameter);*/
      /*width: var(--tjs-label-diameter);*/
      /*align-self: center;*/
      /*text-align: center;*/
      pointer-events: none;
   }

   span {
      pointer-events: initial;
      display: inline-block;
      background: var(--tjs-label-background);
      /*border-radius: var(--tjs-label-border-radius);*/
      position: relative;
      overflow: hidden;
      /*clip-path: var(--tjs-label-clip-path, none);*/
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
      transition: var(--tjs-label-transition);
   }

   span:hover {
      background: var(--tjs-label-background-hover);
      /*clip-path: var(--tjs-label-clip-path-hover, var(--tjs-label-clip-path, none));*/
   }

   span.selected {
      background: var(--tjs-label-background-selected);
      /*clip-path: var(--tjs-label-clip-path-selected, var(--tjs-label-clip-path, none));*/
   }

   /*i {*/
   /*   line-height: var(--tjs-label-diameter);*/
   /*   transform: translateZ(1px);*/
   /*}*/
</style>

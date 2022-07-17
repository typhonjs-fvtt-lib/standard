<script>
   /**
    * --tjs-label-background
    * --tjs-label-background-hover
    * --tjs-label-background-selected
    * --tjs-label-border-radius
    * --tjs-label-font-size - inherit
    * --tjs-label-font-weight - inherit
    * --tjs-label-font-family - inherit
    * --tjs-label-overflow - hidden
    * --tjs-label-padding - 0
    * --tjs-label-transition - global default: 'background 200ms linear'
    */

   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { localize }        from '@typhonjs-svelte/lib/helper';
   import { isWritableStore } from '@typhonjs-svelte/lib/store';
   import {
      isObject,
      isSvelteComponent }     from '@typhonjs-svelte/lib/util';

   export let label;
   export let text;
   export let comp;
   export let title;
   export let titleSelected;
   export let store;
   export let styles;
   export let efx;
   export let onClickPropagate;
   export let onClosePropagate;

   $: text = isObject(label) && typeof label.text === 'string' ? label.text :
    typeof text === 'string' ? text : '';
   $: comp = isObject(label) && isSvelteComponent(label.comp) ? label.comp :
    isSvelteComponent(comp) ? comp : void 0;
   $: title = isObject(label) && typeof label.title === 'string' ? label.title :
    typeof title === 'string' ? title : '';
   $: titleSelected = isObject(label) && typeof label.titleSelected === 'string' ? label.titleSelected :
    typeof titleSelected === 'string' ? titleSelected : '';
   $: store = isObject(label) && isWritableStore(label.store) ? label.store : isWritableStore(store) ?
    store : void 0;
   $: styles = isObject(label) && typeof label.styles === 'object' ? label.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = isObject(label) && typeof label.efx === 'function' ? label.efx :
    typeof efx === 'function' ? efx : () => {};

   $: onClosePropagate = isObject(label) && typeof label.onClosePropagate === 'boolean' ? label.onClosePropagate :
    typeof onClosePropagate === 'boolean' ? onClosePropagate : false
   $: onClickPropagate = isObject(label) && typeof label.onClickPropagate === 'boolean' ? label.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

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
     on:click={onClickDiv}
     on:close={onClose}
     title={localize(titleCurrent)}
     use:applyStyles={styles}>
   <slot name=outer />
   <span on:click={onClick} use:efx class:selected>
      <slot name=left />
      {#if comp}
         <svelte:component this={comp}/>
      {:else}
         <a>{localize(text)}</a>
      {/if}
      <slot name=right />
   </span>
   {#if selected}
      <slot/>
   {/if}
</div>

<style>
   div {
      display: block;
      position: relative;
   }

   span {
      position: relative;

      display: flex;
      justify-content: var(--tjs-label-justify-content, center);
      align-items: var(--tjs-label-align-items, center);

      pointer-events: initial;

      width: 100%;
      height: 100%;

      background: var(--tjs-label-background);
      border-radius: var(--tjs-label-border-radius);
      font-size: var(--tjs-label-font-size, inherit);
      font-weight: var(--tjs-label-font-weight, inherit);
      font-family: var(--tjs-label-font-family, inherit);
      overflow: var(--tjs-label-overflow, hidden);
      padding: var(--tjs-label-padding, 0 0.25em);
      transform-style: preserve-3d;
      transition: var(--tjs-label-transition);
   }

   span:hover {
      background: var(--tjs-label-background-hover);
   }

   span.selected {
      background: var(--tjs-label-background-selected);
   }
</style>

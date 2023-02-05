<script>
   /**
    * --tjs-toggle-label-background
    * --tjs-toggle-label-background-focus-visible
    * --tjs-toggle-label-background-hover
    * --tjs-toggle-label-background-selected
    * --tjs-toggle-label-border
    * --tjs-toggle-label-border-radius
    * --tjs-toggle-label-box-shadow-focus-visible - fallback: --tjs-default-box-shadow-focus-visible
    * --tjs-toggle-label-font-size - inherit
    * --tjs-toggle-label-font-weight - inherit
    * --tjs-toggle-label-font-family - inherit
    * --tjs-toggle-label-overflow - hidden
    * --tjs-toggle-label-padding - 0
    * --tjs-toggle-label-text-shadow-focus - undefined; default: --tjs-default-text-shadow-focus-hover
    * --tjs-toggle-label-text-shadow-hover - undefined; default: --tjs-default-text-shadow-focus-hover
    * --tjs-toggle-label-text-shadow-selected - undefined; default: --tjs-default-text-shadow-focus-hover
    * --tjs-toggle-label-transition - global default: 'background 0.2s ease-in-out'
    * --tjs-toggle-label-transition-focus-visible - fallback: --tjs-default-transition-focus-visible
    */
   import { createEventDispatcher } from 'svelte';

   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { localize }        from '@typhonjs-svelte/lib/helper';
   import { isWritableStore } from '@typhonjs-svelte/lib/store';
   import {
      isObject,
      isSvelteComponent }     from '@typhonjs-svelte/lib/util';

   export let label = void 0;
   export let text = void 0;
   export let comp = void 0;
   export let title = void 0;
   export let titleSelected = void 0;
   export let store = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let keyCode = void 0;
   export let onPress = void 0;
   export let onClose = void 0;
   export let onContextMenu = void 0;
   export let onClickPropagate = void 0;

   const dispatch = createEventDispatcher();

   $: text = isObject(label) && typeof label.text === 'string' ? label.text :
    typeof text === 'string' ? text : void 0;
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
   $: keyCode = isObject(label) && typeof label.keyCode === 'string' ? label.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: onPress = isObject(label) && typeof label.onPress === 'function' ? label.onPress :
    typeof onPress === 'function' ? onPress : void 0;
   $: onClose = isObject(label) && typeof label.onClose === 'function' ? label.onClose :
    typeof onClose === 'function' ? onClose : void 0;
   $: onContextMenu = isObject(label) && typeof label.onContextMenu === 'function' ? label.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: onClickPropagate = isObject(label) && typeof label.onClickPropagate === 'boolean' ? label.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

   let spanEl;
   let selected = false;

   $: if (store) { selected = $store; }

   // Chose the current title when `selected` changes; if there is no `titleSelected` fallback to `title`.
   $: titleCurrent = selected && titleSelected !== '' ? titleSelected : title

   /**
    * Handle click event.
    *
    * @param {MouseEvent}    event -
    */
   function onClick(event)
   {
      selected = !selected;
      if (store) { store.set(selected); }

      if (typeof onPress === 'function') { onPress(selected); }

      dispatch('press', { selected });

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
    * Handles `close:popup` event from any children components like TJSMenu.
    */
   function onClosePopup(event)
   {
      selected = false;
      if (store) { store.set(false); }

      if (typeof onClose === 'function') { onClose(selected); }

      // The close event was triggered from a key press, so focus the anchor element / button.
      if (typeof event?.detail?.keyboardFocus === 'boolean' && event.detail.keyboardFocus && spanEl?.isConnected)
      {
         spanEl.focus();

         event.stopPropagation();
         event.preventDefault();
      }
   }

   /**
    * @param {MouseEvent}   event -
    */
   function onContextMenuPress(event)
   {
      if (typeof onContextMenu === 'function') { onContextMenu(); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Consume / stop propagation of key down when key codes match.
    *
    * @param {KeyboardEvent}    event -
    */
   function onKeydown(event)
   {
      if (event.code === keyCode)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Handle press event if key codes match.
    *
    * @param {KeyboardEvent}    event -
    */
   function onKeyup(event)
   {
      if (event.code === keyCode)
      {
         selected = !selected;
         if (store) { store.set(selected); }

         if (typeof onPress === 'function') { onPress(selected); }

         dispatch('press', { selected });

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class=tjs-toggle-label
     on:click={onClickDiv}
     on:close:popup={onClosePopup}
     title={localize(titleCurrent)}
     use:applyStyles={styles}>
   <slot name=outer />
   <span bind:this={spanEl}
         class:selected
         on:click={onClick}
         on:contextmenu={onContextMenuPress}
         on:keydown={onKeydown}
         on:keyup={onKeyup}
         on:click
         on:contextmenu
         role=button
         tabindex=0
         use:efx>
      <slot name=left />
      {#if comp}
         <svelte:component this={comp}/>
      {:else if typeof text === 'string'}
         <!-- svelte-ignore a11y-missing-attribute -->
         <a role=presentation>{localize(text)}</a>
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
      justify-content: var(--tjs-toggle-label-justify-content, center);
      align-items: var(--tjs-toggle-label-align-items, center);

      pointer-events: initial;

      width: 100%;
      height: 100%;

      background: var(--tjs-toggle-label-background);
      border: var(--tjs-toggle-label-border, none);
      border-radius: var(--tjs-toggle-label-border-radius);
      font-size: var(--tjs-toggle-label-font-size, inherit);
      font-weight: var(--tjs-toggle-label-font-weight, inherit);
      font-family: var(--tjs-toggle-label-font-family, inherit);
      overflow: var(--tjs-toggle-label-overflow, hidden);
      padding: var(--tjs-toggle-label-padding, 0 0.25em);
      transform-style: preserve-3d;
      transition: var(--tjs-toggle-label-transition, background 0.2s ease-in-out);
   }

   span:focus {
      background: var(--tjs-toggle-label-background-focus);
      text-shadow: var(--tjs-toggle-label-text-shadow-focus, var(--tjs-default-text-shadow-focus-hover));
   }

   span:focus-visible {
      background: var(--tjs-toggle-label-background-focus-visible);
      box-shadow: var(--tjs-toggle-label-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
      outline: var(--tjs-toggle-label-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
      transition: var(--tjs-toggle-label-transition-focus-visible, var(--tjs-default-transition-focus-visible));
   }

   span:hover {
      background: var(--tjs-toggle-label-background-hover);
      text-shadow: var(--tjs-toggle-label-text-shadow-hover, var(--tjs-default-text-shadow-focus-hover));
   }

   span.selected {
      background: var(--tjs-toggle-label-background-selected);
      text-shadow: var(--tjs-toggle-label-text-shadow-selected, var(--tjs-default-text-shadow-focus-hover));
   }
</style>

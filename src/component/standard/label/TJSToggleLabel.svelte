<script>
   /**
    * ### CSS Variables
    *
    * ```
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
    * ```
    * @componentDocumentation
    */
   import { createEventDispatcher } from '#svelte';

   import { applyStyles }           from '#runtime/svelte/action/dom';
   import { localize }              from '#runtime/svelte/helper';
   import { TJSSvelteUtil }         from '#runtime/svelte/util';
   import { isObject }              from '#runtime/util/object';
   import { isWritableStore }       from '#runtime/util/store';

   export let label = void 0;

   export let disabled = void 0;
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
   export let clickPropagate = void 0;

   const dispatch = createEventDispatcher();

   const s_EFX_DEFAULT = () => {};

   // ----------------------------------------------------------------------------------------------------------------

   $: disabled = isObject(label) && typeof label.disabled === 'boolean' ? label.disabled :
    typeof disabled === 'boolean' ? disabled : false;
   $: text = isObject(label) && typeof label.text === 'string' ? label.text :
    typeof text === 'string' ? text : void 0;
   $: comp = isObject(label) && TJSSvelteUtil.isComponent(label.comp) ? label.comp :
    TJSSvelteUtil.isComponent(comp) ? comp : void 0;
   $: title = isObject(label) && typeof label.title === 'string' ? label.title :
    typeof title === 'string' ? title : '';
   $: titleSelected = isObject(label) && typeof label.titleSelected === 'string' ? label.titleSelected :
    typeof titleSelected === 'string' ? titleSelected : '';
   $: store = isObject(label) && isWritableStore(label.store) ? label.store : isWritableStore(store) ?
    store : void 0;
   $: styles = isObject(label) && isObject(label.styles) ? label.styles :
    isObject(styles) ? styles : void 0;
   $: efx = isObject(label) && typeof label.efx === 'function' ? label.efx :
    typeof efx === 'function' ? efx : s_EFX_DEFAULT;
   $: keyCode = isObject(label) && typeof label.keyCode === 'string' ? label.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: onPress = isObject(label) && typeof label.onPress === 'function' ? label.onPress :
    typeof onPress === 'function' ? onPress : void 0;
   $: onClose = isObject(label) && typeof label.onClose === 'function' ? label.onClose :
    typeof onClose === 'function' ? onClose : void 0;
   $: onContextMenu = isObject(label) && typeof label.onContextMenu === 'function' ? label.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: clickPropagate = isObject(label) && typeof label.clickPropagate === 'boolean' ? label.clickPropagate :
    typeof clickPropagate === 'boolean' ? clickPropagate : false;

   let spanEl;
   let selected = false;

   $: if (store) { selected = $store; }

   $: if (store && disabled) { $store = false; }

   // Chose the current title when `selected` changes; if there is no `titleSelected` fallback to `title`.
   $: titleCurrent = selected && titleSelected !== '' ? titleSelected : title

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Handle click event.
    *
    * @param {MouseEvent}    event -
    */
   function onClick(event)
   {
      if (disabled) { return; }

      selected = !selected;
      if (store) { store.set(selected); }

      if (typeof onPress === 'function') { onPress({ event, selected }); }

      dispatch('press', { event, selected });

      if (!clickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * In this case we can't set pointer-events: none for the div due to the slotted component, so process clicks on the
    * div in respect to clickPropagate.
    *
    * @param {MouseEvent} event -
    */
   function onClickDiv(event)
   {
      if (disabled) { return; }

      if (!clickPropagate)
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

      if (typeof onClose === 'function') { onClose({ event, selected }); }

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
      if (disabled) { return; }

      if (typeof onContextMenu === 'function') { onContextMenu({ event }); }

      if (!clickPropagate)
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
      if (disabled) { return; }

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
      if (disabled) { return; }

      if (event.code === keyCode)
      {
         selected = !selected;
         if (store) { store.set(selected); }

         if (typeof onPress === 'function') { onPress({ event, selected }); }

         dispatch('press', { event, selected });

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class=tjs-toggle-label
     class:disabled={disabled}
     on:click={onClickDiv}
     on:close:popup={onClosePopup}
     title={localize(titleCurrent)}
     use:applyStyles={styles}
     on:pointerdown|stopPropagation>
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
         tabindex={disabled ? null : 0}
         use:efx={{ disabled }}>
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
      height: var(--tjs-toggle-label-height, var(--tjs-input-height));
   }

   div.disabled > * {
      color: #4b4a44; /* TODO replace with cssVariables default */
      cursor: var(--tjs-toggle-label-cursor-disabled, default);
   }

   div.disabled *:hover {
      text-shadow: none;
      cursor: var(--tjs-toggle-label-cursor-disabled, default);
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

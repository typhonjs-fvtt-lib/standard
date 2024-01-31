<script>
   /**
    * ### CSS Variables:
    *
    * ```
    * --tjs-default-text-shadow-focus-hover: system default
    * --tjs-default-outline-focus-visible: undefined; global replacement for focus-visible outline.
    *
    * --tjs-slot-button-background
    * --tjs-slot-button-background-focus
    * --tjs-slot-button-background-focus-visible
    * --tjs-slot-button-background-hover
    * --tjs-slot-button-border
    * --tjs-slot-button-border-radius
    * --tjs-slot-button-box-shadow-focus-visible
    * --tjs-slot-button-cursor
    * --tjs-slot-button-cursor-disabled
    * --tjs-slot-button-diameter
    * --tjs-slot-button-outline-focus-visible
    * --tjs-slot-button-transition
    * --tjs-slot-button-transition-focus-visible
    * ```
    * @componentDocumentation
    */
   import { createEventDispatcher } from '#svelte';

   import { applyStyles }           from '#runtime/svelte/action/dom';
   import { isObject }              from '#runtime/util/object';

   export let button = void 0;

   export let disabled = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let keyCode = void 0;
   export let onPress = void 0;
   export let onContextMenu = void 0;
   export let clickPropagate = void 0;

   const dispatch = createEventDispatcher();

   const s_EFX_DEFAULT = () => {};

   let efxEl;

   // ----------------------------------------------------------------------------------------------------------------

   $: disabled = isObject(button) && typeof button.disabled === 'boolean' ? button.disabled :
    typeof disabled === 'boolean' ? disabled : false;
   $: styles = isObject(button) && isObject(button.styles) ? button.styles :
    isObject(styles) ? styles : void 0;
   $: efx = isObject(button) && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : s_EFX_DEFAULT;
   $: keyCode = isObject(button) && typeof button.keyCode === 'string' ? button.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: onPress = isObject(button) && typeof button.onPress === 'function' ? button.onPress :
    typeof onPress === 'function' ? onPress : void 0;
   $: onContextMenu = isObject(button) && typeof button.onContextMenu === 'function' ? button.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: clickPropagate = isObject(button) && typeof button.clickPropagate === 'boolean' ? button.clickPropagate :
    typeof clickPropagate === 'boolean' ? clickPropagate : false;

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Handle click event.
    *
    * @param {MouseEvent}    event - MouseEvent
    */
   function onClick(event)
   {
      if (disabled) { return; }

      // Because the efx div has `pointer-events: none` manually trigger event.
      if (efxEl) { efxEl.dispatchEvent(new CustomEvent('efx-trigger', { detail: { event } })); }

      if (typeof onPress === 'function') { onPress({ event }); }

      dispatch('press', { event });

      if (!clickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * @param {MouseEvent}   event - MouseEvent
    */
   function onContextMenuPress(event)
   {
      if (disabled) { return; }

      if (typeof onContextMenu === 'function')
      {
         // Because the efx div has `pointer-events: none` manually trigger event.
         if (efxEl) { efxEl.dispatchEvent(new CustomEvent('efx-trigger', { detail: { event } })); }

         onContextMenu({ event });
      }

      if (!clickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Consume / stop propagation of key down when key codes match.
    *
    * @param {KeyboardEvent}    event - KeyboardEvent
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
    * @param {KeyboardEvent}    event - KeyboardEvent
    */
   function onKeyup(event)
   {
      if (disabled) { return; }

      if (event.code === keyCode)
      {
         // Because the efx is not the key event listener forward on a new event to trigger effect.
         if (efxEl) { efxEl.dispatchEvent(new KeyboardEvent(event.type, { key: event.key, code: event.code })); }

         if (typeof onPress === 'function') { onPress({ event }); }

         dispatch('press', { event });

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div class=tjs-slot-button
     class:disabled={disabled}
     on:click={onClick}
     on:contextmenu={onContextMenuPress}
     on:keydown={onKeydown}
     on:keyup={onKeyup}
     on:click
     on:contextmenu
     role=button
     tabindex={disabled ? null : 0}
     use:applyStyles={styles}>
   <slot />
   {#if efx !== s_EFX_DEFAULT && !disabled}
      <div bind:this={efxEl}
           class=tjs-slot-button-efx
           use:efx />
   {/if}
</div>

<style>
    .tjs-slot-button {
        position: relative;

        height: var(--tjs-slot-button-diameter, fit-content);
        width: var(--tjs-slot-button-diameter, fit-content);

        background: var(--tjs-slot-button-background);
        border: var(--tjs-slot-button-border, var(--tjs-input-border));
        border-radius: var(--tjs-slot-button-border-radius, var(--tjs-input-border-radius));
        cursor: var(--tjs-slot-button-cursor, pointer);
        transition: var(--tjs-slot-button-transition, background 0.2s ease-in-out);
        user-select: none;
       -webkit-tap-highlight-color: var(--tjs-default-webkit-tap-highlight-color, transparent);
    }

    .tjs-slot-button.disabled {
       cursor: var(--tjs-slot-button-cursor-disabled, default);
       filter: var(--tjs-slot-button-filter-disabled, grayscale(100%) contrast(50%));
    }

    .tjs-slot-button:focus {
        background: var(--tjs-slot-button-background-focus);
    }

    .tjs-slot-button:focus-visible {
        background: var(--tjs-slot-button-background-focus-visible);
        box-shadow: var(--tjs-slot-button-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
        outline: var(--tjs-slot-button-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
        transition: var(--tjs-slot-button-transition-focus-visible, var(--tjs-default-transition-focus-visible));
    }

    .tjs-slot-button:hover {
        background: var(--tjs-slot-button-background-hover);
    }

    /**
     * The efx overlay
     */
    .tjs-slot-button-efx {
       position: absolute;
       top: 0;
       left: 0;

       height: 100%;
       width: 100%;
       pointer-events: none;
    }
</style>

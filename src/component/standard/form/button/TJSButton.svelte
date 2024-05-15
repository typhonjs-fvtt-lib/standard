<script>
   /**
    * TODO: Add description
    *
    * @componentDocumentation
    */

   import { createEventDispatcher } from '#svelte';

   import { applyStyles }           from '#runtime/svelte/action/dom';
   import { localize }              from '#runtime/svelte/helper';
   import { TJSSvelteConfigUtil }   from '#runtime/svelte/util';
   import { isObject }              from '#runtime/util/object';

   export let button = void 0;

   // Button props --------------------------------------------------------------------------------------------------

   export let disabled = void 0;

   export let icon = void 0;

   export let label = void 0;

   export let title = void 0;

   export let styles = void 0;

   export let keyCode = void 0;

   export let efx = void 0;

   export let onPress = void 0;
   export let onContextMenu = void 0;
   export let clickPropagate = void 0;

   const dispatch = createEventDispatcher();

   const s_EFX_DEFAULT = () => void 0;

   let efxEl;

   // ----------------------------------------------------------------------------------------------------------------

   $: disabled = isObject(button) && typeof button.disabled === 'boolean' ? button.disabled :
    typeof disabled === 'boolean' ? disabled : false;

   $: icon = isObject(button) && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : void 0;

   $: label = isObject(button) && (typeof button.label === 'string' || TJSSvelteConfigUtil.isConfig(button.label)) ?
    button.label :
     (typeof label === 'string' || TJSSvelteConfigUtil.isConfig(label)) ? label : void 0;

   $: title = isObject(button) && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : void 0;

   $: styles = isObject(button) && isObject(button.styles) ? button.styles :
    isObject(styles) ? styles : void 0;

   $: keyCode = isObject(button) && typeof button.keyCode === 'string' ? button.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: efx = isObject(button) && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : s_EFX_DEFAULT;

   $: onPress = isObject(button) && typeof button.onPress === 'function' ? button.onPress :
    typeof onPress === 'function' ? onPress : void 0;

   $: onContextMenu = isObject(button) && typeof button.onContextMenu === 'function' ? button.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: clickPropagate = isObject(button) && typeof button.clickPropagate === 'boolean' ? button.clickPropagate :
    typeof clickPropagate === 'boolean' ? clickPropagate : false;

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * @param {PointerEvent}    event - PointerEvent
    */
   function onClick(event)
   {
      if (typeof onPress === 'function') { onPress({ event }); }

      dispatch('press', { event });

      if (!clickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * @param {PointerEvent}   event - PointerEvent
    */
   function onContextMenuPress(event)
   {
      if (typeof onContextMenu === 'function')
      {
         // Because the efx is not the key event listener forward on a new event to trigger effect.
         if (efxEl) { efxEl.dispatchEvent(new MouseEvent('contextmenu')); }

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
    * @param {KeyboardEvent}    event -
    */
   function onKeydown(event)
   {
      if (event.code === keyCode)
      {
         event.preventDefault();
         event.stopPropagation();
      }

      // Always prevent the button element from triggering the `click` event on `Enter` key down.
      if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); }
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
         // Because the efx is not the key event listener forward on a new event to trigger effect.
         if (efxEl) { efxEl.dispatchEvent(new KeyboardEvent(event.type, { key: event.key, code: event.code })); }

         if (typeof onPress === 'function') { onPress({ event }); }

         dispatch('press', { event });

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<button class=tjs-form-button
        on:click={onClick}
        on:contextmenu={onContextMenuPress}
        on:keydown={onKeydown}
        on:keyup={onKeyup}
        on:click
        on:contextmenu
        on:press
        {disabled}
        title={localize(title)}
        use:applyStyles={styles}>
   <span class=tjs-form-button-efx bind:this={efxEl} use:efx={{ disabled }}>
      <span class=tjs-form-button-span>
         {#if icon}<i class={icon}></i>{/if}

         {#if $$slots.default}
            <slot />
         {:else if typeof label === 'string'}
            {localize(label)}
         {:else if TJSSvelteConfigUtil.isConfig(label)}
            <svelte:component this={label.class} {...(isObject(label.props) ? label.props : {})} />
         {/if}
      </span>
   </span>
</button>

<style>
   .tjs-form-button-efx {
      display: flex;
      justify-content: center;
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
   }

   .tjs-form-button-efx .tjs-form-button-span {
      transform: translateZ(1px);
   }

   .tjs-form-button-span {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--tjs-form-button-gap, 0.25em);
      padding: var(--tjs-form-button-padding, 6px);
      height: var(--tjs-form-button-height, var(--tjs-input-height, inherit));
      line-height: var(--tjs-form-button-height, var(--tjs-input-height, inherit));
   }

   button {
      /* TODO: cssVariables defaults v2: Consider setting default values from Foundry styles via TJSStyleManager / cssVariables defined in root index.js
      /*background: var(--tjs-form-button-background, var(--tjs-button-background));*/
      /*border: var(--tjs-form-button-border, var(--tjs-button-border));*/
      /*border-radius: var(--tjs-form-button-border-radius, var(--tjs-button-border-radius));*/
      /*border-width: var(--tjs-form-button-border-width, var(--tjs-button-border-width));*/

      cursor: var(--tjs-form-button-cursor, var(--tjs-button-cursor, pointer));
      height: var(--tjs-form-button-height, var(--tjs-input-height, inherit));
      width: var(--tjs-form-button-width, 100%);

      padding: 0;

      user-select: none;
      -webkit-tap-highlight-color: var(--tjs-default-webkit-tap-highlight-color, transparent);
   }

   button:disabled {
      cursor: var(--tjs-form-button-cursor-disabled, var(--tjs-input-cursor-disabled, default));
      filter: var(--tjs-form-button-filter-disabled, var(--tjs-button-filter-disabled, grayscale(100%) contrast(50%)));
      pointer-events: none;
   }

   button:disabled > * {
      text-shadow: var(--tjs-form-button-text-shadow-disabled, var(--tjs-default-text-shadow-disabled, none));
      pointer-events: none;
   }

   button:hover {
      box-shadow: var(--tjs-form-button-box-shadow-hover, var(--tjs-default-box-shadow-hover));
      outline: var(--tjs-form-button-outline-hover, var(--tjs-default-outline-hover, revert));
      transition: var(--tjs-form-button-transition-hover, var(--tjs-default-transition-hover));
      text-shadow: var(--tjs-form-button-text-shadow-hover, var(--tjs-default-text-shadow-hover, inherit));
   }

   button:focus-visible {
      box-shadow: var(--tjs-form-button-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
      outline: var(--tjs-form-button-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert));
      transition: var(--tjs-form-button-transition-focus-visible, var(--tjs-default-transition-focus-visible));
      text-shadow: var(--tjs-form-button-text-shadow-focus-visible, var(--tjs-default-text-shadow-focus-hover, inherit));
   }

   i {
      margin: unset;
   }
</style>

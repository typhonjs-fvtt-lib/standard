<script>
   /**
    * ```
    * --tjs-default-text-shadow-focus-hover: system default
    * --tjs-default-outline-focus-visible: undefined; global replacement for focus-visible outline.
    *
    * --tjs-button-background
    * --tjs-button-background-focus-visible
    * --tjs-button-background-hover
    * --tjs-button-background-selected
    * --tjs-button-border
    * --tjs-button-border-radius
    * --tjs-button-border-width
    * --tjs-button-box-shadow-focus-visible
    * --tjs-button-clip-path
    * --tjs-button-clip-path-focus
    * --tjs-button-clip-path-hover
    * --tjs-button-cursor
    * --tjs-button-diameter
    * --tjs-button-outline-focus-visible
    * --tjs-button-text-shadow-focus: undefined
    * --tjs-button-text-shadow-hover: undefined
    * --tjs-button-transition
    * --tjs-button-transition-focus-visible
    *
    * --tjs-icon-button-background
    * --tjs-icon-button-background-focus-visible
    * --tjs-icon-button-background-hover
    * --tjs-icon-button-background-selected
    * --tjs-icon-button-border
    * --tjs-icon-button-border-radius
    * --tjs-icon-button-border-width
    * --tjs-icon-button-box-shadow-focus-visible
    * --tjs-icon-button-clip-path
    * --tjs-icon-button-clip-path-focus
    * --tjs-icon-button-clip-path-hover
    * --tjs-icon-button-cursor
    * --tjs-icon-button-diameter
    * --tjs-icon-button-outline-focus-visible
    * --tjs-icon-button-text-shadow-focus: undefined
    * --tjs-icon-button-text-shadow-hover: undefined
    * --tjs-icon-button-transition
    * --tjs-icon-button-transition-focus-visible
    * ```
    * @componentDocumentation
    */
   import { createEventDispatcher } from '#svelte';

   import { colord }                from '#runtime/color/colord';
   import { applyStyles }           from '#runtime/svelte/action/dom';
   import { localize }              from '#runtime/svelte/helper';
   import { isObject }              from '#runtime/util/object';

   export let button = void 0;
   export let color = void 0;
   export let title = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let keyCode = void 0;
   export let onPress = void 0;
   export let onContextMenu = void 0;
   export let clickPropagate = void 0;

   const dispatch = createEventDispatcher();

   $: title = isObject(button) && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: styles = isObject(button) && isObject(button.styles) ? button.styles :
    isObject(styles) ? styles : void 0;
   $: efx = isObject(button) && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};
   $: keyCode = isObject(button) && typeof button.keyCode === 'string' ? button.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: onPress = isObject(button) && typeof button.onPress === 'function' ? button.onPress :
    typeof onPress === 'function' ? onPress : void 0;
   $: onContextMenu = isObject(button) && typeof button.onContextMenu === 'function' ? button.onContextMenu :
    typeof onContextMenu === 'function' ? onContextMenu : void 0;

   $: clickPropagate = isObject(button) && typeof button.clickPropagate === 'boolean' ? button.clickPropagate :
    typeof clickPropagate === 'boolean' ? clickPropagate : false;

   let hslColor;

   $: {
      const colordInstance = colord(color);
      hslColor = colordInstance.isValid() ? colordInstance.toHslString() : 'transparent';
   }

   /**
    * Handle click event.
    *
    * @param {KeyboardEvent}    event -
    */
   function onClick(event)
   {
      if (typeof onPress === 'function') { onPress({ event, color: hslColor }); }

      dispatch('press', { event, color: hslColor });

      if (!clickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * @param {MouseEvent}   event -
    */
   function onContextMenuPress(event)
   {
      if (typeof onContextMenu === 'function') { onContextMenu({ event, color: hslColor }); }

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
         if (typeof onPress === 'function') { onPress({ event, color: hslColor }); }

         dispatch('press', { event, color: hslColor });

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div class=tjs-color-button
     use:applyStyles={styles}
     title={localize(title)}
     style:--tjs-icon-button-background={hslColor}>
    <div class=tjs-color-button-inner
         on:click={onClick}
         on:contextmenu={onContextMenuPress}
         on:keydown={onKeydown}
         on:keyup={onKeyup}
         on:click
         on:contextmenu
         role=button
         tabindex=0
         use:efx>
        <slot />
    </div>
</div>

<style>
    .tjs-color-button {
        display: block;
        position: relative;

        flex: 0 0 var(--tjs-icon-button-diameter, var(--tjs-button-diameter, 2em));
        height: var(--tjs-icon-button-diameter, var(--tjs-button-diameter, 2em));
        width: var(--tjs-icon-button-diameter, var(--tjs-button-diameter, 2em));

        align-self: center;
        text-align: center;

        background: var(--tjs-checkerboard-background-10);
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius, 50%));

        cursor: var(--tjs-icon-button-cursor, var(--tjs-button-cursor, pointer));

        clip-path: var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path, none));

        transition: var(--tjs-icon-button-transition, var(--tjs-button-transition, background 0.2s ease-in-out, clip-path 0.2s ease-in-out));
        transform-style: preserve-3d;

        user-select: none;
        -webkit-tap-highlight-color: var(--tjs-default-webkit-tap-highlight-color, transparent);
    }

    .tjs-color-button:before {
        position: absolute;
        content: '';
        inset: -0.5px;
        background: var(--tjs-icon-button-background, var(--tjs-button-background));

        border: var(--tjs-icon-button-border, var(--tjs-button-border));
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius, 50%));
        border-width: var(--tjs-icon-button-border-width, var(--tjs-button-border-width));

        z-index: 0;
    }

    .tjs-color-button:focus {
        text-shadow: var(--tjs-icon-button-text-shadow-focus, var(--tjs-button-text-shadow-focus, var(--tjs-default-text-shadow-focus-hover)));
        clip-path: var(--tjs-icon-button-clip-path-focus, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-focus, var(--tjs-button-clip-path, none))));
    }

    .tjs-color-button:hover {
        clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-hover, var(--tjs-button-clip-path, none))));
        text-shadow: var(--tjs-icon-button-text-shadow-hover, var(--tjs-button-text-shadow-hover, var(--tjs-default-text-shadow-focus-hover)));
    }

    .tjs-color-button-inner {
        width: 100%;
        height: 100%;

        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius, 50%));

        transform: translateZ(1px);
    }

    .tjs-color-button-inner:focus-visible {
        box-shadow: var(--tjs-icon-button-box-shadow-focus-visible, var(--tjs-button-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible)));
        outline: var(--tjs-icon-button-outline-focus-visible, var(--tjs-button-outline-focus-visible, var(--tjs-default-outline-focus-visible, revert)));
        transition: var(--tjs-icon-button-transition-focus-visible, var(--tjs-button-transition-focus-visible, var(--tjs-default-transition-focus-visible)));
    }
</style>

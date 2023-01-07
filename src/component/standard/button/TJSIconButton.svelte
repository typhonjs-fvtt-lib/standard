<script>
   /**
    * --tjs-default-text-shadow-focus-hover: system default
    * --tjs-comp-outline-focus-visible: undefined; global replacement for focus-visible outline.
    *
    * --tjs-button-background
    * --tjs-button-background-focus
    * --tjs-button-background-hover
    * --tjs-button-background-selected
    * --tjs-button-border
    * --tjs-button-border-radius
    * --tjs-button-border-width
    * --tjs-button-clip-path
    * --tjs-button-clip-path-hover
    * --tjs-button-clip-path-focus
    * --tjs-button-cursor
    * --tjs-button-diameter
    * --tjs-button-outline-focus
    * --tjs-button-text-shadow-focus: undefined
    * --tjs-button-text-shadow-hover: undefined
    * --tjs-button-transition
    *
    * --tjs-icon-button-background
    * --tjs-icon-button-background-focus
    * --tjs-icon-button-background-hover
    * --tjs-icon-button-background-selected
    * --tjs-icon-button-border
    * --tjs-icon-button-border-radius
    * --tjs-icon-button-border-width
    * --tjs-icon-button-clip-path
    * --tjs-icon-button-clip-path-focus
    * --tjs-icon-button-clip-path-hover
    * --tjs-icon-button-cursor
    * --tjs-icon-button-diameter
    * --tjs-icon-button-outline-focus
    * --tjs-icon-button-text-shadow-focus: undefined
    * --tjs-icon-button-text-shadow-hover: undefined
    * --tjs-icon-button-transition
    */
   import { createEventDispatcher } from 'svelte';

   import { applyStyles }           from '@typhonjs-svelte/lib/action';
   import { localize }              from '@typhonjs-svelte/lib/helper';
   import { isObject }              from '@typhonjs-svelte/lib/util';

   export let button = void 0;
   export let icon = void 0;
   export let title = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let keyCode = void 0;
   export let onPress = void 0;
   export let onContextClick = void 0;
   export let onClickPropagate = void 0;

   const dispatch = createEventDispatcher();

   $: icon = isObject(button) && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : '';
   $: title = isObject(button) && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: styles = isObject(button) && typeof button.styles === 'object' ? button.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = isObject(button) && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};
   $: keyCode = isObject(button) && typeof button.keyCode === 'string' ? button.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   $: onPress = isObject(button) && typeof button.onPress === 'function' ? button.onPress :
    typeof onPress === 'function' ? onPress : void 0;
   $: onContextClick = isObject(button) && typeof button.onContextClick === 'function' ? button.onContextClick :
    typeof onContextClick === 'function' ? onContextClick : void 0;

   $: onClickPropagate = isObject(button) && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

   /**
    * Handle click event.
    *
    * @param {MouseEvent}    event -
    */
   function onClick(event)
   {
      if (typeof onPress === 'function') { onPress(); }

      dispatch('press');

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * @param {MouseEvent}   event -
    */
   function onContextMenu(event)
   {
      if (typeof onContextClick === 'function') { onContextClick(); }

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
         if (typeof onPress === 'function') { onPress(); }

         dispatch('press');

         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class=tjs-icon-button use:applyStyles={styles}>
    <!-- svelte-ignore a11y-missing-attribute -->
    <a on:click={onClick}
       on:contextmenu={onContextMenu}
       on:keydown={onKeydown}
       on:keyup={onKeyup}
       on:click
       on:contextmenu
       role=button
       tabindex=0
       title={localize(title)}
       use:efx>
        <i class={icon}></i>
    </a>
</div>

<style>
    div {
        pointer-events: none;
        display: block;
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
        cursor: var(--tjs-icon-button-cursor, var(--tjs-button-cursor, pointer));
        position: relative;
        overflow: hidden;
        clip-path: var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path, none));
        transform-style: preserve-3d;
        width: 100%;
        height: 100%;
        transition: var(--tjs-icon-button-transition, var(--tjs-button-transition));
        text-decoration: none;
    }

    a:focus {
        text-shadow: var(--tjs-icon-button-text-shadow-focus, var(--tjs-button-text-shadow-focus, var(--tjs-default-text-shadow-focus-hover)));
        clip-path: var(--tjs-icon-button-clip-path-focus, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-focus, var(--tjs-button-clip-path, none))));
    }

    a:focus-visible {
        background: var(--tjs-icon-button-background-focus, var(--tjs-button-background-focus));
        outline: var(--tjs-icon-button-outline-focus, var(--tjs-button-outline-focus, var(--tjs-comp-outline-focus-visible, revert)));
    }

    a:hover {
        background: var(--tjs-icon-button-background-hover, var(--tjs-button-background-hover));
        clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-hover, var(--tjs-button-clip-path, none))));
        text-shadow: var(--tjs-icon-button-text-shadow-hover, var(--tjs-button-text-shadow-hover, var(--tjs-default-text-shadow-focus-hover)));
    }

    i {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));
        transform: translateZ(1px);
    }
</style>

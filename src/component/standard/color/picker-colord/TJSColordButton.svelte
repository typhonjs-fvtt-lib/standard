<script>
   /**
    * --tjs-button-background
    * --tjs-button-background-hover
    * --tjs-button-background-selected
    * --tjs-button-border
    * --tjs-button-border-radius
    * --tjs-button-border-width
    * --tjs-button-clip-path-hover
    * --tjs-button-cursor
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
    * --tjs-icon-button-cursor
    * --tjs-icon-button-diameter
    * --tjs-icon-button-transition
    */
   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { localize }        from '@typhonjs-svelte/lib/helper';

   import { colord }          from '#runtime/color/colord';

   export let button = void 0;
   export let color = void 0;
   export let title = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let onClick = void 0;
   export let onClickPropagate = void 0;
   export let onContextClick = void 0;

   $: title = typeof button === 'object' && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: styles = typeof button === 'object' && typeof button.styles === 'object' ? button.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof button === 'object' && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};
   $: onClick = typeof button === 'object' && typeof button.onClick === 'function' ? button.onClick :
    typeof onClick === 'function' ? onClick : void 0;
   $: onClickPropagate = typeof button === 'object' && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : true;
   $: onContextClick = typeof button === 'object' && typeof button.onContextClick === 'function' ? button.onContextClick :
    typeof onContextClick === 'function' ? onContextClick : void 0;

   let hslColor;

   $: {
      const colordInstance = colord(color);
      hslColor = colordInstance.isValid() ? colordInstance.toHslString() : 'transparent';
   }

   function onClickHandler(event)
   {
      if (typeof onClick === 'function') { onClick(hslColor); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   function onContextClickHandler(event)
   {
      if (typeof onContextClick === 'function') { onContextClick(hslColor); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   function onKeyDownHandler(event)
   {
      if (event.code === 'Enter')
      {
         if (typeof onClick === 'function') { onClick(hslColor); }
      }
   }
</script>

<div class=tjs-color-button
     on:click
     on:contextmenu
     on:keydown
     on:click={onClickHandler}
     on:contextmenu={onContextClickHandler}
     on:keydown|preventDefault={onKeyDownHandler}
     use:applyStyles={styles}
     title={localize(title)}
     style:--tjs-icon-button-background={hslColor}
     role=button
     >
    <div class=tjs-color-button-inner use:efx />
    <slot />
</div>

<style>
    .tjs-color-button {
        display: block;
        position: relative;

        flex: 0 0 var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
        height: var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
        width: var(--tjs-icon-button-diameter, var(--tjs-button-diameter));

        align-self: center;
        text-align: center;

        background: var(--tjs-checkerboard-background-10);
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));

        cursor: var(--tjs-icon-button-cursor, var(--tjs-button-cursor, pointer));

        clip-path: var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path, none));

        transform-style: preserve-3d;
    }

    .tjs-color-button:before {
        position: absolute;
        content: '';
        inset: -0.5px;
        background: var(--tjs-icon-button-background, var(--tjs-button-background));

        border: var(--tjs-icon-button-border, var(--tjs-button-border));
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));
        border-width: var(--tjs-icon-button-border-width, var(--tjs-button-border-width));

        z-index: 0;
    }

    .tjs-color-button:hover {
        clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path-hover, var(--tjs-button-clip-path-hover, none)));
    }

    .tjs-color-button-inner {
        width: 100%;
        height: 100%;

        overflow: hidden;
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));

        transform: translateZ(1px);
    }
</style>

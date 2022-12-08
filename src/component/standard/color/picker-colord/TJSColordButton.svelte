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

   import { colord }          from '@typhonjs-fvtt/runtime/color/colord';

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

<div on:click={onClickHandler}
     on:contextmenu={onContextClickHandler}
     on:keydown|preventDefault={onKeyDownHandler}
     use:applyStyles={styles}
     title={localize(title)}
     style:--tjs-icon-button-background={hslColor}
     role=button>
    <div class=inner
         use:efx
         role=button>
    </div>
</div>

<style>
    div {
        display: block;
        position: relative;
        pointer-events: none;

        background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%);
        background-size: 10px 10px;
        background-position: 0 0, 5px 5px;

        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));
        overflow: hidden;

        flex: 0 0 var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
        height: var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
        width: var(--tjs-icon-button-diameter, var(--tjs-button-diameter));
        align-self: center;
        text-align: center;

        clip-path: var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path, none));
    }

    div:hover {
        clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path-hover, var(--tjs-button-clip-path-hover, none)));
    }

    .inner {
        display: block;
        pointer-events: initial;

        background: var(--tjs-icon-button-background, var(--tjs-button-background));
        border: var(--tjs-icon-button-border, var(--tjs-button-border));
        border-radius: var(--tjs-icon-button-border-radius, var(--tjs-button-border-radius));
        border-width: var(--tjs-icon-button-border-width, var(--tjs-button-border-width));

        cursor: var(--tjs-icon-button-cursor, var(--tjs-button-cursor, pointer));
    }
</style>

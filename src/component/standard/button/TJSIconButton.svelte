<script>
   /**
    * --tjs-button-background
    * --tjs-button-background-hover
    * --tjs-button-background-selected
    * --tjs-button-border
    * --tjs-button-border-radius
    * --tjs-button-border-width
    * --tjs-button-clip-path
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

   export let button = void 0;
   export let icon = void 0;
   export let title = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let onClick = void 0;
   export let onClickPropagate = void 0;

   $: icon = typeof button === 'object' && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : '';
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

   function onClickHandler(event)
   {
      if (typeof onClick === 'function') { onClick(); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div on:click={onClickHandler} use:applyStyles={styles} title={localize(title)} role=presentation>
    <a on:click use:efx role=presentation>
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
    }

    a:hover {
        background: var(--tjs-icon-button-background-hover, var(--tjs-button-background-hover));
        clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, var(--tjs-button-clip-path-hover, none)));
    }

    i {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;

        transform: translateZ(1px);
    }
</style>

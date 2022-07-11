<script>
   /**
    * --tjs-icon-button-background
    * --tjs-icon-button-background-hover
    * --tjs-icon-button-background-selected
    * --tjs-icon-button-border-radius
    * --tjs-icon-button-clip-path
    * --tjs-icon-button-clip-path-hover
    * --tjs-icon-button-clip-path-selected
    * --tjs-icon-button-diameter
    * --tjs-icon-button-transition
    */
   import { applyStyles }     from '@typhonjs-svelte/lib/action';
   import { localize }        from '@typhonjs-svelte/lib/helper';

   export let button;
   export let icon;
   export let title;
   export let styles;
   export let efx;
   export let onClickPropagate;

   $: icon = typeof button === 'object' && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : '';
   $: title = typeof button === 'object' && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: styles = typeof button === 'object' && typeof button.styles === 'object' ? button.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof button === 'object' && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};
   $: onClickPropagate = typeof button === 'object' && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : true;

   function onClick(event)
   {
      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div on:click on:click={onClick} use:applyStyles={styles} title={localize(title)}>
    <a on:click use:efx>
        <i class={icon}></i>
    </a>
</div>

<style>
    div {
        pointer-events: none;
        display: block;
        flex: 0 0 var(--tjs-icon-button-diameter);
        height: var(--tjs-icon-button-diameter);
        width: var(--tjs-icon-button-diameter);
        align-self: center;
        text-align: center;
    }

    a {
        pointer-events: initial;
        display: inline-block;
        background: var(--tjs-icon-button-background);
        border-radius: var(--tjs-icon-button-border-radius);
        position: relative;
        overflow: hidden;
        clip-path: var(--tjs-icon-button-clip-path, none);
        transform-style: preserve-3d;
        width: 100%;
        height: 100%;
        transition: var(--tjs-icon-button-transition);
    }

    a:hover {
        background: var(--tjs-icon-button-background-hover);
        clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, none));
    }

    i {
        line-height: var(--tjs-icon-button-diameter);
        transform: translateZ(1px);
    }
</style>

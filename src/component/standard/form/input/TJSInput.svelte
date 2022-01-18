<script>
   /**
    * --tjs-input-border
    * --tjs-input-border-radius
    * --tjs-input-background
    * --tjs-input-cursor
    * --tjs-input-height
    * --tjs-input-width
    *
    * --tjs-comp-input-border
    * --tjs-comp-input-border-radius
    * --tjs-comp-input-background
    * --tjs-comp-input-cursor
    * --tjs-comp-input-height
    * --tjs-comp-input-width
    */

   import { onMount }      from 'svelte';
   import { writable }     from 'svelte/store';
   import { applyStyles }  from '@typhonjs-svelte/lib/action';
   import { isStore }      from '@typhonjs-svelte/lib/store';
   import { autoBlur }     from '@typhonjs-fvtt/svelte-standard/action';

   export let input;
   export let type;
   export let disabled;
   export let store;
   export let styles;
   export let efx;

   $: type = typeof input === 'object' && typeof input.type === 'string' ? input.type :
    typeof type === 'string' ? type : void 0;
   $: disabled = typeof input === 'object' && typeof input.disabled === 'boolean' ? input.disabled :
    typeof disabled === 'boolean' ? disabled : false;
   $: store = typeof input === 'object' && isStore(input.store) ? input.store :
    isStore(store) ? store : writable(void 0);
   $: styles = typeof input === 'object' && typeof input.styles === 'object' ? input.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof input === 'object' && typeof input.efx === 'function' ? input.efx :
    typeof efx === 'function' ? efx : () => {};

   onMount(() =>
   {
   });
</script>

<div class=tjs-input-container use:efx use:applyStyles={styles}>
    <input class=tjs-input
           bind:value={$store}
           use:autoBlur
           {disabled}
    />
</div>

<style>
    .tjs-input-container {
        background: var(--tjs-comp-input-background, var(--tjs-input-background));
        border-radius: var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));
        display: block;
        overflow: hidden;
        height: var(--tjs-comp-input-height, var(--tjs-input-height));
        width: var(--tjs-comp-input-width, var(--tjs-input-width));
        transform-style: preserve-3d;
    }

    input {
        display: inline-block;
        position: relative;
        overflow: hidden;

        background: transparent;

        border: var(--tjs-comp-input-border, var(--tjs-input-border));
        border-radius: var(--tjs-comp-input-border-radius, var(--tjs-input-border-radius));

        width: 100%;
        height: 100%;

        color: inherit;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;

        cursor: var(--tjs-comp-input-cursor, var(--tjs-input-cursor));

        transform: translateZ(1px);
    }
</style>

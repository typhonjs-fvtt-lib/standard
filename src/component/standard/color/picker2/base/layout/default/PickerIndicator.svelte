<script>
   import { getContext } from 'svelte';

   /** @type {{ x: number; y: number }} */
   export let pos = void 0;

   const { isDark } = getContext('#tjs-color-picker-state').colorState.stores;

   /** @type {string} */
   $: pickerStyle = `left: calc(${(pos.x / 200) * 186}% + 2px); top: calc(${
    (pos.y / 200) * 186}% + 2px); box-shadow: 0 0 4px ${$isDark ? 'white' : 'black'};`
</script>

<div class=picker-indicator style={pickerStyle} />

<style>
    div {
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: white;
        border-radius: 5px;

        pointer-events: none;
        z-index: 1;
        transition: box-shadow 0.2s;
    }
</style>

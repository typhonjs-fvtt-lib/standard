<script>
   /** @type {{ x: number; y: number }} */
   export let pos = void 0;

   /** @type {string} */
   /* svelte-ignore unused-export-let */
   export let hex = void 0;

   /** @type {boolean} */
   export let isDark = void 0;

   $: pickerStyle = `left: calc(${(pos.x / 260) * 246}% + 2px); top: calc(${
    (pos.y / 160) * 149}% + 2px); box-shadow: 0 0 4px ${isDark ? 'white' : 'black'};`;
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

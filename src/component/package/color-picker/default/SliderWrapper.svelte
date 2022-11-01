<script>
   /** @type {boolean} */
   export let focused = void 0;

   /** @type {boolean} */
   /* svelte-ignore unused-export-let */
   export let toRight = void 0;
</script>

<div class=slider-wrapper class:focused>
    <slot />
</div>

<style>
    div {
        display: inline-block;
        margin-right: 5px;
        width: var(--tjs-color-picker-slider-width, 14px);
        height: var(--tjs-color-picker-picker-height, 200px);
        border-radius: 7px;
        overflow: hidden;
        user-select: none;

        outline: 2px solid transparent;
        outline-offset: 3px;
        transition: outline 0.2s ease-in-out;
    }

    div.focused {
        outline: 2px solid var(--tjs-color-picker-focus-color, red);
    }
</style>

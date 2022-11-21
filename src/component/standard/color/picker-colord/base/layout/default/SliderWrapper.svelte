<script>
   /** @type {boolean} */
   export let focused = void 0;
</script>

<div class=slider-wrapper class:focused>
    <slot />
</div>

<style>
    div {
        display: inline-block;
        margin: var(--tjs-color-picker-slider-margin, 0 5px 0 0);
        width: var(--tjs-color-picker-slider-width, 14px);
        height: var(--tjs-color-picker-slider-height, 200px);
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

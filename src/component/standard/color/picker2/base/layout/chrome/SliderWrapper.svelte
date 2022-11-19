<script>
   /** @type {boolean} */
   export let focused;
</script>

<div class=slider-wrapper class:focused>
    <slot />
</div>

<style>
    div {
        display: inline-block;
        margin: var(--tjs-color-picker-slider-margin, 4px);
        width: var(--tjs-color-picker-slider-width, 250px);
        height: var(--tjs-color-picker-slider-height, 10px);
        border-radius: 7px;
        overflow: hidden;

        outline: 2px solid transparent;
        outline-offset: 3px;
        transition: outline 0.2s ease-in-out;
        user-select: none;
    }

    div.focused {
        outline: 2px solid var(--tjs-color-picker-focus-color, red);
    }
</style>

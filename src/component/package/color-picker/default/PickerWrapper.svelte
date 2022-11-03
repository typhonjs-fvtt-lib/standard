<script>
   /** @type {boolean} */
   export let focused = void 0;
</script>

<div class=picker-wrapper class:focused>
    <slot />
</div>

<style>
    div {
        display: inline-block;
        margin: var(--tjs-color-picker-picker-margin, 0 5px 0 0);
        height: var(--tjs-color-picker-picker-height, 200px);
        width: var(--tjs-color-picker-picker-width, 200px);
        border-radius: var(--tjs-color-picker-picker-border-radius, 8px);
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

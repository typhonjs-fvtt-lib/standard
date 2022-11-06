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
        margin-bottom: 5px;
        height: 200px;
        width: 260px;
        border-radius: 8px 8px 0 0;
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

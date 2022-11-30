<script>
   /** @type {boolean} */
   export let focused = void 0;
</script>

<div class=tjs-picker-wrapper class:focused>
    <slot />
</div>

<style>
    @container tjs-color-picker-container (min-width: 0) {
        .tjs-picker-wrapper {
            width: var(--tjs-color-picker-picker-width, 75cqw);
            height: var(--tjs-color-picker-picker-height, 75cqw);

            border-radius: var(--tjs-color-picker-picker-border-radius, max(4px, 2cqw));
        }
    }
</style>

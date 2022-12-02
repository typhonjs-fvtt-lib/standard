<script>
   /** @type {boolean} */
   export let focused = void 0;
</script>

<div class=tjs-picker-wrapper class:focused>
    <slot />
</div>

<style>
    .tjs-picker-wrapper {
        overflow: hidden;
        user-select: none;
    }

    @container tjs-color-picker-container (min-width: 0) {
        .tjs-picker-wrapper {
            border-radius: var(--tjs-color-picker-wrapper-border-radius, max(4px, 2cqw) max(4px, 2cqw) 0 0);
            width: var(--tjs-color-picker-picker-width, 100%);
            height: var(--tjs-color-picker-picker-height, 77cqw);
        }
    }
</style>

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
        box-shadow: var(--tjs-color-picker-wrapper-box-shadow, 0 0 2px black);
    }

    @container tjs-color-picker-container (min-width: 0) {
        .tjs-picker-wrapper {
            border-radius: max(4px, 2cqw);
            width: 75cqw;
            height: 75cqw;
        }
    }
</style>

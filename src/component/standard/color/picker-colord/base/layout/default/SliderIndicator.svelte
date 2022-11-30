<script>
   import { applyStyles } from '@typhonjs-svelte/lib/action';

   export let focused = false;
   export let styles = void 0;
</script>

<div class=tjs-slider-indicator use:applyStyles={styles} class:focused />

<style>
    @container tjs-color-picker-container (min-width: 0) {
        /**
         * slider indicator relative to entire container vs slider as independent container.
         * These values are the static values when slider width is clamped above to 10px.
         */
        .tjs-slider-indicator {
            border: max(2px, 1cqw) solid white;
            border-radius: max(7px, 3.5cqw);
            margin-left: min(-2px, -1cqw);

            outline-width: max(2px, 1cqw);

            width: max(14px, 7cqw);
            height: max(14px, 7cqw);
        }
    }
</style>

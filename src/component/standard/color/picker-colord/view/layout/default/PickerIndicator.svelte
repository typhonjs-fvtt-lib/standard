<script>
   import { applyStyles } from '#runtime/svelte/action/dom';

   export let focused = false;
   export let styles = void 0;
</script>

<div class=tjs-picker-indicator use:applyStyles={styles} class:focused />

<style>
    .tjs-picker-indicator {
        position: absolute;
        pointer-events: none;
        z-index: 1;

        background: transparent;

        box-sizing: border-box;
        box-shadow: 0 0 4px black, inset 0 0 4px black;
    }

    .tjs-picker-indicator.focused {
        box-shadow: var(--tjs-color-picker-box-shadow-focus-visible, var(--tjs-default-box-shadow-focus-visible));
        outline: var(--tjs-color-picker-outline-focus-visible, var(--tjs-default-outline-focus-visible, 2px solid red));
        transition: var(--tjs-color-picker-transition-focus-visible, var(--tjs-default-transition-focus-visible));
    }

    @container tjs-color-picker-container (min-width: 0) {
        /**
         * slider indicator relative to entire container vs slider as independent container.
         * These values are the static values when slider width is clamped above to 10px.
         */
        .tjs-picker-indicator {
            border: max(2px, 1cqw) solid white;
            border-radius: max(6px, 3.5cqw);

            outline-width: max(2px, 1cqw);

            width: max(12px, 7cqw);
            height: max(12px, 7cqw);
        }
    }
</style>

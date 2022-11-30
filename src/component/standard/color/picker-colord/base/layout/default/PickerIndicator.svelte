<script>
   import { applyStyles } from '@typhonjs-svelte/lib/action';

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

        outline-color:transparent;
        outline-style: solid;

        transition: outline 0.2s ease-in-out;
    }

    .tjs-picker-indicator.focused {
        outline-color: var(--tjs-color-picker-focus-color, red);
    }

    @container tjs-color-picker-container (min-width: 0) {
        /**
         * slider indicator relative to entire container vs slider as independent container.
         * These values are the static values when slider width is clamped above to 10px.
         */
        .tjs-picker-indicator {
            border: max(2px, 1cqw) solid white;
            border-radius: max(7px, 3.5cqw);

            outline-width: max(2px, 1cqw);

            width: max(14px, 7cqw);
            height: max(14px, 7cqw);
        }
    }
</style>

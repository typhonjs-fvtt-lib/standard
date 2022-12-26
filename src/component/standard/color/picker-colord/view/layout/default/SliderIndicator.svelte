<script>
   import { getContext }    from 'svelte';

   import { applyStyles } from '@typhonjs-svelte/lib/action';

   const sliderHorizontal = getContext('#tjs-color-picker-slider-horizontal');

   export let focused = false;
   export let styles = void 0;
</script>

<div class=tjs-slider-indicator use:applyStyles={styles} class:focused class:horizontal={sliderHorizontal} />

<style>
    .tjs-slider-indicator {
        position: absolute;
        pointer-events: none;
        z-index: 1;

        background: transparent;

        box-sizing: border-box;
        box-shadow: 0 0 4px black, inset 0 0 4px black;
    }

    .tjs-slider-indicator.focused {
        outline: var(--tjs-color-picker-outline-focus, var(--tjs-comp-outline-focus-visible, 2px solid red));
    }

    @container tjs-color-picker-container (min-width: 0) {
        /**
         * slider indicator relative to entire container vs slider as independent container.
         * These values are the static values when slider width is clamped above to 10px.
         */
        .tjs-slider-indicator {
            margin-left: min(-2px, -1cqw);
            margin-top: 0;

            border: max(2px, 1cqw) solid white;
            border-radius: max(6px, 3.5cqw);

            outline-width: max(2px, 1cqw);

            width: max(12px, 7cqw);
            height: max(12px, 7cqw);
        }

        .tjs-slider-indicator.horizontal {
            margin-left: 0;
            margin-top: min(-2px, -1cqw);
        }
    }
</style>

<script>
   import { getContext }    from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');
   const sliderHorizontal = getContext('#tjs-color-picker-slider-horizontal');

   const { components } = internalState.stores;
</script>

<div class=tjs-slider-wrapper class:horizontal={sliderHorizontal}>
    <slot />
</div>

<style>
    .tjs-slider-wrapper {
        display: inline-block;
        border-radius: var(--tjs-color-picker-slider-border-radius, 7px);
        user-select: none;
    }

    @container tjs-color-picker-container (min-width: 0) {
        .tjs-slider-wrapper {
            margin: var(--tjs-color-picker-picker-margin, 0 max(3px, 2.5cqw) 0 0);
            width: var(--tjs-color-picker-slider-width, max(10px, 5cqw));
            height: var(--tjs-color-picker-slider-height, 75cqw);
        }

        .tjs-slider-wrapper.horizontal {
            margin: var(--tjs-color-picker-picker-margin, 0 0 max(3px, 2.5cqw) 0);
            width: var(--tjs-color-picker-slider-width, 90cqw);
            height: var(--tjs-color-picker-slider-height, max(10px, 5cqw));
        }
    }
</style>

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
        user-select: none;
    }

    @container tjs-color-picker-container (min-width: 0) {
        .tjs-slider-wrapper {
            width: var(--tjs-color-picker-slider-width, max(8px, 5cqw));
            height: var(--tjs-color-picker-slider-height, 75cqw);
        }

        .tjs-slider-wrapper.horizontal {
            width: var(--tjs-color-picker-slider-width, calc(98cqw - max(6px, 4cqw)));
            height: var(--tjs-color-picker-slider-height, max(8px, 5cqw));
        }
    }
</style>

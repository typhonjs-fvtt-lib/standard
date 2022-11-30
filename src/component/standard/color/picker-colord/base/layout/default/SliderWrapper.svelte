<script>
   import { getContext }    from 'svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const { components, sliderHorizontal } = internalState.stores;
</script>

<!--<div class=tjs-slider-wrapper class:focused>-->
<div class=tjs-slider-wrapper class:horizontal={$sliderHorizontal}>
    <slot />
</div>

<style>
    @container tjs-color-picker-container (min-width: 0) {
        .tjs-slider-wrapper {
            margin: var(--tjs-color-picker-picker-margin, 0 max(3px, 2.5cqw) 0 0);

            width: var(--tjs-color-picker-slider-width, max(10px, 5cqw));
            height: var(--tjs-color-picker-slider-height, 75cqw);
        }

        .tjs-slider-wrapper.horizontal {
            margin: var(--tjs-color-picker-picker-margin, 0 0 max(3px, 2.5cqw) 0);
        }
    }

    /**
     * As things go `container-query-polyfill` doesn't support containers inside containers. In the future
     * convert slider to a container as well to make the styles easier to manage. Below is the initial conversion.
     */

    /*div {*/
    /*    container: tjs-color-picker-slider-container / inline-size;*/
    /*}*/

    /*@container tjs-color-picker-slider-container (min-width: 0) {*/
    /*   .tjs-color-picker .tjs-color-picker-wrapper-default .tjs-slider-indicator {*/
    /*       border: 20cqw solid white;*/
    /*       border-radius: 70cqw;*/
    /*       margin-left: -20cqw;*/

    /*       outline-width: 20cqw;*/

    /*       width: 140cqw;*/
    /*       height: 140cqw;*/
    /*   }*/
    /*}*/
</style>

<script>
   /** @type {boolean} */
   // export let focused = void 0;
</script>

<!--<div class=tjs-slider-wrapper class:focused>-->
<div class=tjs-slider-wrapper>
    <slot />
</div>

<style>
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

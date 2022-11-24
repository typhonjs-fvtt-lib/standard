<script>
   /** @type {number} */
   export let pos = void 0;

   /** @type {string} */
   $: sliderStyle = `left: calc(${(pos / 200) * 192}% + 2px);`;
</script>

<div class=tjs-slider-indicator style={sliderStyle} />

<style>
    div {
        position: absolute;
        background-color: white;

        /*border-radius: 5px;*/
        /*margin-top: 2px;*/
        /*width: 6px;*/
        /*height: 6px;*/

        pointer-events: none;
        z-index: 1;
    }
</style>

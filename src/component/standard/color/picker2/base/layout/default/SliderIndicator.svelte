<script>
   /** @type {number} */
   export let pos = void 0;

   /** @type {string} */
   $: sliderStyle = `top: calc(${(pos / 200) * 186}% + 2px);`;
</script>

<div class=slider-indicator style={sliderStyle} />

<style>
    div {
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: white;
        border-radius: 5px;
        margin-left: 2px;

        pointer-events: none;
        z-index: 1;
    }
</style>

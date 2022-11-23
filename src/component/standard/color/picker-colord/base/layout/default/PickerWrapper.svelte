<script>
   /** @type {boolean} */
   export let focused = void 0;
</script>

<div class=tjs-picker-wrapper class:focused>
    <slot />
</div>

<!--<style>-->
<!--    div {-->
<!--        display: inline-block;-->
<!--        border-radius: var(&#45;&#45;tjs-color-picker-picker-border-radius, 8px);-->
<!--        overflow: hidden;-->
<!--        user-select: none;-->

<!--        outline: 2px solid transparent;-->
<!--        outline-offset: 3px;-->
<!--        transition: outline 0.2s ease-in-out;-->
<!--    }-->

<!--    div.focused {-->
<!--        outline: 2px solid var(&#45;&#45;tjs-color-picker-focus-color, red);-->
<!--    }-->
<!--</style>-->

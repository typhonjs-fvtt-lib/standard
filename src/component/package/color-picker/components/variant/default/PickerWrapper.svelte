<script>
   /** @type {boolean} */
   export let focused = void 0;

   /** @type {boolean} */
   /* svelte-ignore unused-export-let */
   export let toRight = void 0;
</script>

<div class=picker-wrapper class:focused>
    <slot />
</div>

<style>
    div {
        display: inline-block;
        margin-right: 5px;
        height: 200px;
        width: 200px;
        border-radius: 8px;
        overflow: hidden;

        outline: 2px solid transparent;
        outline-offset: 3px;
        transition: outline 0.2s ease-in-out;
        user-select: none;
    }

    div.focused {
        outline: 2px solid var(--focus-color, red);
    }
</style>

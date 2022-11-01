<script>
   /** @type {HTMLElement} */
   export let wrapper = void 0;

   /** @type {boolean} */
   export let isOpen = void 0;

   /** @type {boolean} */
   export let isPopup = void 0;

   /** @type {boolean} */
   /* svelte-ignore unused-export-let */
   export let toRight = void 0;
</script>

<div class=wrapper
        bind:this={wrapper}
        class:isOpen
        class:isPopup
        role={isPopup ? 'dialog' : void 0}
        aria-label="color picker"
>
    <slot />
</div>

<style>
    div {
        padding: 8px 5px 5px 8px;
        background-color: white;
        margin: 0 10px 10px;
        border: 1px solid black;
        border-radius: 12px;
        display: none;
        width: max-content;
    }

    .isOpen {
        display: block;
    }

    .isPopup {
        position: absolute;
        top: 25px;
        z-index: 2;
    }
</style>

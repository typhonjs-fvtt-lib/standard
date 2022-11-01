<script>
   /** @type {HTMLElement} */
   export let wrapper;

   /** @type {boolean} */
   export let isOpen;

   /** @type {boolean} */
   export let isPopup;

   /** @type {boolean} */
   /* svelte-ignore unused-export-let */
   export let toRight;
</script>

<div class=wrapper
     bind:this={wrapper}
     class:isOpen
     class:isPopup
     role={isPopup ? 'dialog' : void 0}
     aria-label="color picker">
    <slot />
</div>

<style>
    div {
        background-color: white;
        margin: 0 10px 15px;
        padding-bottom: 3px;
        border: 1px solid black;
        border-radius: 8px;
        display: none;
    }

    .isOpen {
        display: flex;
        flex-direction: column;
    }

    .isPopup {
        position: absolute;
        top: 25px;
        z-index: 2;
    }

    div:not(.isPopup) {
        display: inline-flex;
        flex-direction: column;
    }

    div :global(.text-input) {
        margin: 5px;
    }
</style>

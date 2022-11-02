<script>
   /** @type {HTMLLabelElement} */
   export let labelWrapper = void 0;

   /** @type {string} */
   export let hex = void 0;

   /** @type {boolean} */
   /* svelte-ignore unused-export-let */
   export let isOpen = void 0;
</script>

<label bind:this={labelWrapper}>
    <div>
        <input type=color
               value={hex}
               on:click|preventDefault={() => {	/**/ }}
               aria-haspopup=dialog />
    </div>
</label>

<style>
    label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        border-radius: 3px;
        margin: 4px;
    }

    div {
        display: flex;
        width: 30px;
        height: 30px;
        overflow: hidden;
        border-radius: 15px;
        align-items: center;
        justify-content: center;
    }

    input {
        margin: 0;
        padding: 0;
        border: none;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        cursor: pointer;
    }

    :global(.has-been-tabbed) label:focus-within {
        outline: 2px solid var(--tjs-color-picker-focus-color, red);
        outline-offset: 2px;
    }
</style>

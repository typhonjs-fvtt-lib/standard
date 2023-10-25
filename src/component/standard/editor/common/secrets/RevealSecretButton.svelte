<script>
   import { localize }      from '#runtime/svelte/helper';

   /** @type {function} */
   export let onUpdateRevealButtons = void 0;

   /** @type {HTMLElement} */
   export let sectionEl = void 0;

   const revealed = sectionEl.classList.contains('revealed');
</script>

<button type=button
        class=reveal
        on:click={() => onUpdateRevealButtons(!revealed, sectionEl.id)}>
    {localize(`EDITOR.${revealed ? 'Hide' : 'Reveal'}`)}
</button>

<style>
    button {
        user-select: none;
    }
</style>

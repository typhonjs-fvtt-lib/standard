<script>
   import { getContext }    from '#svelte';

   import TJSSvgFolder      from '../../../folder/TJSSvgFolder.svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const addOnState = internalState.addOnState;
</script>

{#if $addOnState.length > 0}
    <div class=tjs-color-picker-addons>
        {#each $addOnState as addOn (addOn.id)}
            <section>
                <TJSSvgFolder folder={addOn.folderData} keyCode={'Space'} />
            </section>
        {/each}
    </div>
{/if}

<style>
    .tjs-color-picker-addons {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    section {
        --tjs-folder-contents-margin: 0;
        --tjs-folder-contents-padding: 0;
        --tjs-folder-details-margin-left: 0;
        --tjs-folder-details-padding-left: 0;
        --tjs-folder-summary-chevron-margin: 0 2px;
        --tjs-folder-summary-gap: 0;
        --tjs-folder-summary-margin: 0;
        --tjs-folder-summary-padding: 0;
        --tjs-folder-summary-width: 100%;

        background: var(--tjs-color-picker-overlay-background, rgba(0, 0, 0, 0.1));
        border: var(--tjs-color-picker-overlay-border, var(--tjs-input-border, 2px solid rgba(0, 0, 0, 0.75)));
        border-radius: 0.25em;
    }

    @container tjs-color-picker-container (min-width: 0) {
        section {
            --tjs-folder-summary-label-width: 45cqw;
        }

        .tjs-color-picker-addons {
            gap: min(8px, 2cqw);
        }
    }
</style>

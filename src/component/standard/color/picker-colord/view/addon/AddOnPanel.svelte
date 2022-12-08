<script>
   import { getContext }    from 'svelte';

   import TJSSvgFolder      from '../../../../folder/TJSSvgFolder.svelte';

   import SavedColors           from './saved-colors/SavedColors.svelte';
   import SavedColorsSummaryEnd from './saved-colors/SavedColorsSummaryEnd.svelte';

   const internalState = getContext('#tjs-color-picker-state');

   const addOnList = [
      {
         id: 'saved-colors',
         label: 'Saved Colors',
         content: {
            class: SavedColors
         },
         slotSummaryEnd: {
            class: SavedColorsSummaryEnd
         },
         styles: {
            '--tjs-summary-width': '98%'
         }
      }
   ];
</script>

<div class=tjs-color-picker-addons>
    {#each addOnList as addOn (addOn.id)}
        <section>
            <TJSSvgFolder folder={addOn}>
                <svelte:fragment slot=summary-end>
                    {#if addOn?.slotSummaryEnd}
                        <svelte:component this={addOn.slotSummaryEnd.class} {...(addOn.slotSummaryEnd.props ? addOn.slotSummaryEnd.props : {})} />
                    {/if}
                </svelte:fragment>
                {#if addOn?.content}
                    <svelte:component this={addOn.content.class} {...(addOn.content.props ? addOn.content.props : {})} />
                {/if}
            </TJSSvgFolder>
        </section>
    {/each}
</div>

<style>
    .tjs-color-picker-addons {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    section {
        background: var(--tjs-color-picker-overlay-background, rgba(0, 0, 0, 0.1));
        border: var(--tjs-color-picker-overlay-border, var(--tjs-input-border, 2px solid rgba(0, 0, 0, 0.75)));
        border-radius: 0.25em;
        padding-left: 0.5em;
    }

    @container tjs-color-picker-container (min-width: 0) {
        .tjs-color-picker-addons {
            gap: min(8px, 2cqw);
        }

        section {

        }
    }
</style>

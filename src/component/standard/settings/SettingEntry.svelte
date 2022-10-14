<script>
    /** @type {object} */
    export let setting = void 0;

    const store = setting.store;
</script>

<section>
    <label for={setting.id}>{setting.name}</label>
    <div class=form-fields>
        {#if setting.componentType === 'checkbox'}
            <input type=checkbox id={setting.id} bind:checked={$store} />
        {:else if setting.componentType === 'number'}
            <input type=number id={setting.id} bind:value={$store} />
        {:else if setting.componentType === 'range'}
            <input type=range id={setting.id} min={setting.range.min} max={setting.range.max} step={setting.range.step} bind:value={$store} />
        {:else if setting.componentType === 'select'}
            <select id={setting.id} bind:value={$store}>
                {#each setting.choices as choice}
                    <option value={choice.value}>
                        {choice.text}
                    </option>
                {/each}
            </select>
        {:else if setting.componentType === 'text'}
            <input type=text id={setting.id} bind:value={$store} />
        {/if}
    </div>
    <p class=notes>
        {setting.hint}
    </p>
</section>

<style>
    section {
        clear: both;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: 3px 0;
        align-items: center;
    }

    section:not(:last-child) {
        margin-bottom: 1rem;
    }

    section label {
        line-height: var(--form-field-height);
        flex: 2;
    }

    section .form-fields {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        flex: 3;
        justify-content: flex-end;
        align-items: center;
    }

    section .notes {
        flex: 0 0 100%;
        font-size: var(--font-size-12);
        line-height: var(--line-height-16);
        color: var(--color-text-dark-secondary);
        margin: 3px 0;
        min-height: 1rem;
    }
</style>

<script>
   import { getContext }   from 'svelte';

   const internalState = getContext('#cp-state');

   const { isAlpha } = internalState.stores;
   const { textState } = internalState.colorState.stores;

   /** @type {['HEX', 'RGB', 'HSV']} */
   const modes = ['HEX', 'RGB', 'HSV'];

   /** @type {number} */
   let mode = 0;

   const { alpha } = textState.alpha.stores;
   const { hex, isHexValid } = textState.hex.stores;
   const { h, s, v } = textState.hsv.stores;
   const { r, g, b } = textState.rgb.stores;
</script>

<div class=text-input>
    {#if mode === 0}
        <div class=input-container>
            <input aria-label="hex color"
                   class:is-hex-invalid={!$isHexValid}
                   bind:value={$hex}
                   style="flex: 3"
            />
            {#if $isAlpha}
                <input aria-label="transparency chanel color"
                       bind:value={$alpha}
                       type=number
                       min=0
                       max=1
                       step=0.01
                />
            {/if}
        </div>
    {:else if mode === 1}
        <div class=input-container>
            <input aria-label="red chanel color"
                   bind:value={$r}
                   type=number
                   min=0
                   max=255
            />
            <input aria-label="green chanel color"
                   bind:value={$g}
                   type=number
                   min=0
                   max=255
            />
            <input aria-label="blue chanel color"
                   bind:value={$b}
                   type=number
                   min=0
                   max=255
            />
            {#if $isAlpha}
                <input aria-label="transparency chanel color"
                       bind:value={$alpha}
                       type=number
                       min=0
                       max=1
                       step=0.01
                />
            {/if}
        </div>
    {:else}
        <div class=input-container>
            <input aria-label="hue chanel color"
                   bind:value={$h}
                   type=number
                   min=0
                   max=360
            />
            <input aria-label="saturation chanel color"
                   bind:value={$s}
                   type=number
                   min=0
                   max=100
            />
            <input aria-label="brightness chanel color"
                   bind:value={$v}
                   type=number
                   min=0
                   max=100
            />
            {#if $isAlpha}
                <input aria-label="transparency chanel color"
                       bind:value={$alpha}
                       type=number
                       min=0
                       max=1
                       step=0.01
                />
            {/if}
        </div>
    {/if}
    <button aria-label="change inputs to {modes[(mode + 1) % 3]}"
            on:click={() => (mode = (mode + 1) % 3)}>{modes[mode]}
    </button>
</div>

<style>
    input[type="number"] {
        appearance: auto;
    }

    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: inner-spin-button;
        opacity: 1
    }

    .text-input {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 10px 5px 5px;
    }

    .input-container {
        display: flex;
        flex: 1;
        gap: 10px;
    }

    .is-hex-invalid {
        color: red;
    }

    input,
    button {
        flex: 1;
        border: none;
        background-color: #eee;
        padding: 0;
        border-radius: 5px;
        height: 30px;
        line-height: 30px;
        text-align: center;
    }

    input {
        width: 5px;
    }

    button {
        cursor: pointer;
        flex: 1;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: #ccc;
    }

    input:focus,
    button:focus {
        outline: none;
    }

    :global(.has-been-tabbed) input:focus-visible,
    :global(.has-been-tabbed) button:focus-visible {
        outline: 2px solid var(--tjs-color-picker-focus-color, red);
        outline-offset: 2px;
    }
</style>

<script>
   /**
    * Provides a slotted component wrapped in a label element. The `label` prop can either be a string or a Svelte
    * configuration object to be used as the label text. The label element uses `display: contents` which ignores the
    * label element and lays out the children as if the label element does not exist which is perfect for a grid layout.
    * Optionally, there are CSS variables available to change the `display` and additional flex layout configuration
    * possibilities.
    *
    * The following CSS variables control the associated styles with the default values.
    *
    * For layout:
    * -----------------------------------------------------
    * --tjs-slot-label-display - contents
    * --tjs-slot-label-flex - unset
    * --tjs-slot-label-flex-direction - unset
    * --tjs-slot-label-flex-wrap - unset
    *
    * For text / string label:
    * -----------------------------------------------------
    * --tjs-slot-label-color - inherit
    * --tjs-slot-label-font-family - inherit
    * --tjs-slot-label-font-size - inherit
    * --tjs-slot-label-line-height - inherit
    * --tjs-slot-label-text-align - right
    * --tjs-slot-label-white-space - nowrap
    */

   import { localize }           from '#runtime/svelte/helper';
   import { isTJSSvelteConfig }  from '#runtime/svelte/util';
   import { isObject }           from '#runtime/util/object';

   import { TJSSlotLabelUtil }   from './TJSSlotLabelUtil.js';

   export let label = void 0;

   $: label = TJSSlotLabelUtil.isValid(label) ? label : void 0;
</script>

{#if label}
   <!-- svelte-ignore a11y-label-has-associated-control -->
   <label class=tjs-slot-label>
      {#if typeof label === 'string'}
         <span class=tjs-slot-label-span>{localize(label)}</span>
      {:else if isTJSSvelteConfig(label)}
         <svelte:component this={label.class} {...(isObject(label.props) ? label.props : {})} />
      {/if}

      <slot />
   </label>
{:else}
   <slot />
{/if}

<style>
   label {
      display: var(--tjs-slot-label-display, contents);

      /* Unset, but available when 'display' is changed */
      flex: var(--tjs-slot-label-flex, unset);
      flex-direction: var(--tjs-slot-label-flex-direction, unset);
      flex-wrap: var(--tjs-slot-label-flex-wrap, unset);
   }

   span {
      color: var(--tjs-slot-label-color, inherit);
      font-family: var(--tjs-slot-label-font-family, inherit);
      font-size: var(--tjs-slot-label-font-size, inherit);
      line-height: var(--tjs-slot-label-line-height, inherit);
      text-align: var(--tjs-slot-label-text-align, right);
      white-space: var(--tjs-slot-label-white-space, nowrap);
   }
</style>

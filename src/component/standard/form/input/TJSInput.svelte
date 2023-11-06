<script>
   /**
    * Provides a generic "input" component that creates the specific input component based on 'type'. If no `type`
    * property is available in the input object `text` is the default.
    *
    * You may optionally define a label either as `input.label` or through the `label` prop as a string. The label
    * element uses `display: contents` which ignores the label element and lays out the children as if the
    * label element does not exist which is perfect for a grid layout.
    *
    * The following CSS variables control the associated styles with the default values.
    *
    * --tjs-input-label-display - content
    * --tjs-input-label-text-align - right
    * --tjs-input-label-white-space - nowrap
    */

   import { isObject }          from '#runtime/util/object';

   import TJSInputNumber        from './TJSInputNumber.svelte';
   import TJSInputText          from './TJSInputText.svelte';

   export let input = void 0;

   export let label = void 0;

   $: label = isObject(input) && typeof input.label === 'string' ? input.label :
    typeof label === 'string' ? label : void 0;

   let component;

   $: {
      const type = isObject(input) && typeof input.type === 'string' ? input.type : 'text';

      switch (type)
      {
         case 'email':
         case 'password':
         case 'search':
         case 'text':
         case 'url':
            component = TJSInputText;
            break;

         case 'number':
            component = TJSInputNumber;
            break;

         default:
            throw new Error(
             `'TJSInput' currently only supports text input types: 'email', 'number', 'password', 'search', 'text', 'url'.`);
      }
   }
</script>

{#if label}
   <!-- svelte-ignore a11y-label-has-associated-control -->
   <label class=tjs-input-label>
      <slot name=label-before />

      {#if typeof label === 'string'}
         <span class=tjs-input-label-span>{label}</span>
      {/if}

      <slot name=label-after />

      <svelte:component this={component} {...$$props} />

      <slot />
   </label>
{:else}
   <svelte:component this={component} {...$$props} />
{/if}

<style>
   label {
      display: var(--tjs-input-label-display, contents);
   }

   span {
      text-align: var(--tjs-input-label-text-align, right);
      white-space: var(--tjs-input-label-white-space, nowrap);
   }
</style>

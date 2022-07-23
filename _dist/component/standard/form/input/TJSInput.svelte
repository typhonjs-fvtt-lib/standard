<script>
   /**
    * Provides a generic "input" component that creates the specific input component based on 'type'.
    *
    * You must provide the configuration solely through the `input` prop which is passed onto the actual implementation.
    *
    * If no `type` property is available in the input object `text` is assumed as the default.
    */

   import { isObject }          from '@typhonjs-fvtt/runtime/svelte/util';

   import TJSInputText          from './TJSInputText.svelte';

   export let input = void 0;

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

         default:
            throw new Error(
             `'TJSInput currently only supports text input types: 'email', 'password', 'search', 'text', 'url'.`);
      }
   }
</script>

<svelte:component this={component} {input} />

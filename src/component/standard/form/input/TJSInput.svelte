<script>
   /**
    * Provides a generic "input" component that creates the specific input component based on 'type'. If no `type`
    * property is available in the input object `text` is the default.
    *
    * You may optionally define a label either as `input.label` or through the `label` prop as a string. The label
    * element uses `display: contents` which ignores the label element and lays out the children as if the
    * label element does not exist which is perfect for a grid layout.
    *
    * ### CSS Variables
    *
    * The following CSS variables control the associated styles with the default values:
    * ```
    * --tjs-input-label-display - content
    * --tjs-input-label-text-align - right
    * --tjs-input-label-white-space - nowrap
    * ```
    * @componentDocumentation
    */

   import { isObject }           from '#runtime/util/object';

   import TJSInputCheckbox       from './TJSInputCheckbox.svelte';
   import TJSInputNumber         from './TJSInputNumber.svelte';
   import TJSInputRange          from './TJSInputRange.svelte';
   import TJSInputText           from './TJSInputText.svelte';

   import TJSButton              from '../button/TJSButton.svelte';
   import TJSSelect              from '../select/TJSSelect.svelte';

   export let input = void 0;

   export let type = void 0;

   let component;

   // Some components need to reassign `input` to another prop name. Warnings are only generated w/ the Vite dev server.
   let passedProps = Object.assign({}, $$props);

   // Remove the `type` prop used locally.
   delete passedProps.type;

   $: {
      type = isObject(input) && typeof input.type === 'string' ? input.type :
       typeof type === 'string' ? type : 'text';

      switch (type)
      {
         case 'button':
            // Reassign prop `input` to `button`.
            passedProps.button = input;
            delete passedProps.input;

            component = TJSButton;
            break;

         case 'checkbox':
            component = TJSInputCheckbox;
            break;

         case 'number':
            component = TJSInputNumber;
            break;

         case 'range':
            component = TJSInputRange;
            break;

         case 'email':
         case 'password':
         case 'search':
         case 'text':
         case 'url':
            component = TJSInputText;
            break;


         case 'select':
            // Reassign prop `input` to `select`.
            passedProps.select = input;
            delete passedProps.input;

            component = TJSSelect;
            break;

         default:
            throw new Error(`'TJSInput' currently only supports the following input types: 'button', 'checkbox', ` +
             `'email', 'number', 'password', 'range, 'search', 'select', 'text', and 'url'.`);
      }
   }
</script>

{#if type === 'button'}
   <svelte:component this={component} on:click on:press on:contextmenu {...passedProps} />
{:else if type === 'select'}
   <svelte:component this={component} {...passedProps} />
{:else}
   <svelte:component this={component} {...passedProps} />
{/if}



import RevealSecretButton     from './RevealSecretButton.svelte';

import { nextAnimationFrame } from '#runtime/util/animate';
import { processHTML }        from '#runtime/util/html';
import { safeAccess }         from '#runtime/util/object';

/**
 * Creates the `mountRevealSecretButtons` action that adds buttons to reveal any secret sections that have a CSS ID.
 *
 * This action only upgrades the content when a document / fieldName is defined.
 *
 * @param {import('#runtime/svelte/store/fvtt/document').TJSDocument}   doc - Document wrapper.
 *
 * @param {{fieldName: string}}  options - Options object from the editor containing the `fieldName`
 *
 * @returns {function(*): {update({mountRevealButtons: *}): void, destroy(): void}}
 */
export function createMountRevealSecretButtons(doc, options)
{
   /**
    * Provides the callback function that RevealSecretButton invokes when it is clicked to process the current
    * document field specified adding or removing the `revealed` CSS class to the secret section.
    *
    * @param {boolean}  revealed - Secret revealed state.
    *
    * @param {string}   id - The CSS ID assigned to the secret section.
    */
   function onUpdateRevealButtons(revealed, id)
   {
      /** @type {foundry.abstract.Document} */
      const foundryDoc = doc.get();

      if (foundryDoc && typeof options?.fieldName === 'string')
      {
         const html = safeAccess(foundryDoc, options?.fieldName);

         if (typeof html === 'string')
         {
            const newContent = processHTML({
               html,
               process: (element) => element.classList[`${revealed ? 'add' : 'remove'}`]('revealed'),
               selector: `section.secret[id=${id}]`,
               firstMatchOnly: true
            });

            foundryDoc.update({ [options?.fieldName]: newContent });
         }
      }
   }

   /**
    * Returns the `mountRevealSecretButtons` action.
    */
   return (node) =>
   {
      const components = [];

      /**
       * Destroy any created components.
       */
      function destroyComponents()
      {
         for (const component of components) { component.$destroy(); }
         components.length = 0;
      }

      /**
       * Mounts new secret reveal buttons.
       */
      function mountComponents()
      {
         // Must wait until next animation frame so that the node / element is populated with content.
         nextAnimationFrame().then(() =>
         {
            destroyComponents();

            // Collect all secret sections that have a CSS ID.
            const secretSections = node.querySelectorAll('section.secret[id]');

            // Mount secret reveal buttons with the section element and the `onUpdateRevealButtons` callback.
            for (const sectionEl of secretSections)
            {
               components.push(new RevealSecretButton({
                  target: sectionEl,
                  anchor: sectionEl.firstChild,
                  props: {
                     onUpdateRevealButtons,
                     sectionEl
                  }
               }));
            }
         });
      }

      return {
         /**
          * On update if the external parameter `mountRevealButtons` is true and a document / fieldName is defined
          * mount the secret reveal buttons otherwise destroy any existing buttons.
          *
          * Note: In the editor components `enrichedContent` is also passed, but unused, but it will trigger an update
          * whenever the content changes.
          *
          * @param mountRevealButtons
          */
         update({ mountRevealButtons }) {
            if (mountRevealButtons && doc.get() && typeof options?.fieldName === 'string') { mountComponents(); }
            else { destroyComponents(); }
         },

         destroy() {
            destroyComponents();
         }
      };
   }
}

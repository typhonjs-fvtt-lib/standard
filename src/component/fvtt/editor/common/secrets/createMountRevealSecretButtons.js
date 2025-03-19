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
      /**
       * Hookup any secret reveal buttons from text enrichment.
       */
      function buttonEvents()
      {
         // Must wait until next animation frame so that the node / element is populated with content.
         nextAnimationFrame().then(() =>
         {
            /** @type {foundry.abstract.Document} */
            const foundryDoc = doc.get();

            // Collect all secret sections that have a CSS ID.
            const secretSections = node.querySelectorAll('section.secret[id]');

            // Hookup secret reveal buttons with the section element and the `onUpdateRevealButtons` callback.
            for (const sectionEl of secretSections)
            {
               const button = sectionEl.querySelector('button.reveal');

               if (button)
               {
                  // Only hook up button if there is a valid Foundry doc associated.
                  if (foundryDoc && typeof options?.fieldName === 'string')
                  {
                     const revealed = sectionEl.classList.contains('revealed');
                     const id = sectionEl.id;
                     button.addEventListener('click', () => onUpdateRevealButtons(!revealed, id), { once: true });
                  }
                  else // Otherwise hide the reveal button.
                  {
                     button.style.display = 'none';
                  }
               }
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
         update({ mountRevealButtons })
         {
            if (mountRevealButtons) { buttonEvents(); }
         }
      };
   };
}

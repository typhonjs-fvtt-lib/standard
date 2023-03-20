import { striptags }    from '@typhonjs-svelte/lib/util';

import { FVTTVersion }  from '@typhonjs-fvtt/svelte-standard/fvtt';

export class CEImpl
{
   /**
    * Provides a set of `KeyboardEvent.key` values that are allowed when handling `options.maxCharacterLength`.
    *
    * @type {Set<string>}
    */
   static #MAX_KEY_ALLOWED = new Set([
      'Backspace',
      'Shift',
      'Control',
      'Alt',
      'CapsLock',
      'PageUp',
      'PageDown',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
      'Insert',
      'Delete',
      'Meta'
   ]);

   /**
    * Defines a regex to check for the shape of a raw Foundry document UUID.
    *
    * @type {RegExp}
    */
   static #UUID_REGEX = /(\.).*([a-zA-Z0-9]{16})/;

   static hasEnterKeyHandler(options)
   {
      return (typeof options.preventEnterKey === 'boolean' && options.preventEnterKey) ||
       (typeof options.saveOnEnterKey === 'boolean' && options.saveOnEnterKey);
   }

   static insertTextAtCursor(text)
   {
      if (typeof globalThis.getSelection !== 'function')
      {
         console.warn(`[TRL] Browser does not support 'getSelection'.`);
         return;
      }

      const selection = globalThis.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);

      for (let position = 0; position !== text.length; position++)
      {
         selection.modify('move', 'right', 'character');
      }
   }

   /**
    * Determines if the given key event is valid when preventing default action and max character length is reached.
    *
    * @param {KeyboardEvent}  event - A KeyboardEvent.
    *
    * @returns {boolean} Prevent default or not.
    */
   static isValidKeyForMaxCharacterLength(event)
   {
      const selectionLength = typeof globalThis.getSelection === 'function' ?
       globalThis.getSelection().getRangeAt(0).toString().length : 0;

      // Allow key through when there is a selection range.
      if (selectionLength > 0) { return false; }

      // Allow select all (Ctrl-A); copy (Ctrl-C); paste (Ctrl-V); undo (Ctrl-Z).
      if ((event.ctrlKey || event.metaKey) && (event.code === 'KeyA' || event.code === 'KeyC' ||
       event.code === 'KeyV' || event.code === 'KeyZ'))
      {
         return false;
      }

      // Allow certain control keys, but prevent all others.
      return !this.#MAX_KEY_ALLOWED.has(event.key);
   }

   /**
    * Handles paste preprocessing. Prevents pasting when `options.maxContentLength` is set and only partially pastes
    * text to fit within the max length.
    *
    * For Foundry v10 and above when `options.maxContentLength` is not defined pasted text is examined for the shape
    * of a raw UUID and if detected attempts to retrieve the document and if found will generate a proper document link
    * from it. You can get the raw UUID by context-clicking the icon in the app header bar for various documents.
    *
    * @param {HTMLDivElement} editorEl -
    *
    * @param {string}         text -
    *
    * @param {object}         options -
    *
    * @param {number}         maxCharacterLength -
    *
    * @returns {string}  Processed paste text.
    */
   static pastePreprocess(editorEl, text, options, maxCharacterLength)
   {
      // Must handle pasted text as plain text for max content length. No automatic conversion of raw UUIDs.
      if (maxCharacterLength >= 0)
      {
         if (typeof globalThis.getSelection !== 'function')
         {
            console.warn(`[TRL] Browser does not support 'getSelection'.`);
            return '';
         }

         // First strip any latent HTML tags.
         let content = striptags(text);

         // In the case of if `preventEnterKey` or `saveOnEnterKey` we assume single line content / entry, so strip
         // all newlines.
         if (this.hasEnterKeyHandler(options)) { content = content.replace(/[\n\r]+/g, ''); }

         const bodyLength = editorEl.innerText.length;
         const selectionLength = globalThis.getSelection().getRangeAt(0).toString().length;

         if (selectionLength > 0)
         {
            // Only need to consider reducing content when the content length > selection length.
            if (content.length > selectionLength)
            {
               const adjustedTotalLength = content.length + bodyLength - selectionLength;
               if (adjustedTotalLength > maxCharacterLength)
               {
                  content = content.substring(0, content.length - (adjustedTotalLength - maxCharacterLength));
               }
            }
         }
         else
         {
            if ((content.length + bodyLength) > maxCharacterLength)
            {
               const remainingLength = maxCharacterLength - bodyLength;
               content = content.substring(0, remainingLength);
            }
         }

         text = content;
      }
      else // Evaluate pasted text that is a raw UUID and convert it to a document link.
      {
         // Check if pasted test matches the shape of a UUID. If so do a lookup and if a document is retrieved build
         // a UUID.
         if (FVTTVersion.isAtLeast(10) && this.#UUID_REGEX.test(text))
         {
            const uuidDoc = globalThis.fromUuidSync(text);
            if (uuidDoc) { text = `@UUID[${text}]{${uuidDoc.name}}`; }
         }
      }

      return text;
   }

   /**
    * Sets the initial selection based on `options.initialSelection`.
    *
    * @param {HTMLDivElement} editorEl - `.editor` element.
    *
    * @param {string}   initialSelection - Initial selection option.
    *
    * @param {string}   defaultValue - Default value if initialSelection is invalid.
    */
   static setInitialSelection(editorEl, initialSelection, defaultValue)
   {
      const type = initialSelection === 'all' || initialSelection === 'end' || initialSelection === 'start' ?
       initialSelection : defaultValue;

      // Sanity check.
      if (!editorEl || typeof globalThis.getSelection !== 'function')
      {
         console.warn(`[TRL] Browser does not support 'getSelection'.`);
         return;
      }

      const selection = document.getSelection();
      const range = document.createRange();

      switch (type)
      {
         case 'all':
            range.selectNodeContents(editorEl);
            selection.removeAllRanges();
            selection.addRange(range);
            break;

         case 'end':
         {
            const lastElementChild = editorEl.lastElementChild;
            if (lastElementChild)
            {
               range.setStartAfter(lastElementChild);
               range.setEndAfter(lastElementChild);
               selection.removeAllRanges();
               selection.addRange(range);
            }
            break;
         }
         case 'start':
         {
            const firstElementChild = editorEl.firstElementChild;
            if (firstElementChild)
            {
               range.setStart(firstElementChild, 0);
               range.setEnd(firstElementChild, 0);
               selection.removeAllRanges();
               selection.addRange(range);
            }
            break;
         }
      }
   }
}

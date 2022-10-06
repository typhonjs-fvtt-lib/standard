import { striptags }    from '@typhonjs-svelte/lib/util';
import { FontManager }  from '../../../internal/FontManager.js';

export class MCEImpl
{
   /**
    * Stores the CSS variable data that is inspected on the `.editor-content` div before the editor is active and
    * copies these values if set or the default values to the body element of the TinyMCE IFrame.
    *
    * @type {object[]}
    */
   static #s_CSS_VARS_EDITOR = [
      { variable: '--tjs-editor-content-color', property: 'color', default: '#000' },
      { variable: '--tjs-editor-content-font-family', property: 'font-family', default: 'Signika' },
      { variable: '--tjs-editor-content-font-size', property: 'font-size', default: '10.5pt' },
      { variable: '--tjs-editor-content-line-height', property: 'line-height', default: '1.2' },
      { variable: '--tjs-editor-content-padding', property: 'padding', default: '3px 0 0 0' }
   ];

   static beforeInputHandler(editor, event, options, maxCharacterLength)
   {
      // Early out as `maxCharacterLength` is not defined and `wordcount` MCE plugin not installed.
      if (maxCharacterLength === void 0 || editor.plugins.wordcount === void 0) { return; }

       // Early out if not trusted.
      if (!event?.isTrusted) { return; }

      const inputType = event.inputType;

      // Early out if deleting content.
      if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') { return; }

      const hasSelection = editor.plugins.wordcount.selection.getCharacterCount() > 0;

      // Early out if there is a selection and text is inserted.
      if (hasSelection && inputType === 'insertText') { return; }

      const bodyLength = editor.plugins.wordcount.body.getCharacterCount();

      if (bodyLength >= maxCharacterLength)
      {
         event.preventDefault();
         event.stopPropagation();
         return false;
      }
   }

   static hasEnterKeyHandler(options)
   {
      return (typeof options.preventEnterKey === 'boolean' && options.preventEnterKey) ||
       (typeof options.saveOnEnterKey === 'boolean' && options.saveOnEnterKey)
   }

   static get isV5() { return tinymce?.majorVersion === '5'; }
   static get isV6() { return tinymce?.majorVersion === '6'; }

   static keydownHandler(editor, event, options, saveEditor, content)
   {
      switch (event.key)
      {
         case 'Enter':
            // Handles `preventEnterKey` option.
            if (MCEImpl.hasEnterKeyHandler(options))
            {
               event.preventDefault();
               event.stopPropagation();

               // Handle `saveOnEnterKey` option.
               if (typeof options.saveOnEnterKey === 'boolean' && options.saveOnEnterKey) { saveEditor(); }

               return false;
            }
            break;

         // Close the editor on 'esc' key pressed; reset content; invoke the registered Foundry save callback with
         // a deferral via setTimeout.
         case 'Escape':
            editor.resetContent(content);
            setTimeout(() => saveEditor(), 0);
            break;
      }
   }

   /**
    * Provides a mechanism to load core Foundry fonts and any additional font family definitions. The returned data
    * includes the parsed font family definitions and the configuration data TinyMCE needs for loading the font formats.
    *
    * @param {Object<FontFamilyDefinition>}  [extraFonts] - Extra user defined fonts to load.
    *
    * @returns {{ fonts: Object<FontFamilyDefinition>[], fontFormats: string}} Font formats for MCE & all fonts to load.
    */
   static getFontData(extraFonts = {})
   {
      if (typeof extraFonts !== 'object') { throw new TypeError(`'extraFonts' is not an object.`); }

      // TODO Sanitize / confirm extraFonts data / add `editor` field if missing.

      /**
       * @type {Object<FontFamilyDefinition>[]}
       */
      const fonts = [
         ...FontManager.getCoreDefinitions(),
         extraFonts
      ];

      // Process font font family definitions to create the font format string for TinyMCE. Remove duplicates.

      /** @type {Set<string>} */
      const fontFormatSet = new Set();

      for (const definitions of fonts)
      {
         if (typeof definitions === 'object')
         {
            for (const family of Object.keys(definitions))
            {
               fontFormatSet.add(`${family}=${family};`);
            }
         }
      }

      return { fonts, fontFormats: [...fontFormatSet].sort().join('') };
   }

   /**
    *
    * @param {TinyMCE.Editor} editor -
    *
    * @param {object}         args -
    *
    * @param {object}         options -
    *
    * @param {number}         maxCharacterLength -
    */
   static pastePreprocess(editor, args, options, maxCharacterLength)
   {
      const contentIsString = typeof args.content === 'string';

      // Prevent paste if content is not a string or `preventPaste` option is active.
      if (!contentIsString || (typeof options.preventPaste === 'boolean' && options.preventPaste))
      {
         args.stopImmediatePropagation();
         args.stopPropagation();
         args.preventDefault();
      }
      else if (maxCharacterLength >= 0)
      {
         // First strip any latent HTML tags.
         let content = striptags(args.content);

         // In the case of if `preventEnterKey` or `saveOnEnterKey` we assume single line content / entry, so strip
         // all newlines.
         if (this.hasEnterKeyHandler(options)) { content = content.replace(/[\n\r]+/g, ''); }


         const bodyLength = editor.plugins.wordcount.body.getCharacterCount();
         const selectionLength = editor.plugins.wordcount.selection.getCharacterCount();

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

         args.content = content;
      }
   };

   /**
    * Copies over the CSS variable data that is inspected on the `.editor-content` div before the editor is active if
    * set or the default values to the body element of the TinyMCE IFrame.
    *
    * @param editorContentEl
    *
    * @return {string} TinyMCE config `content_style` parameter for .
    */
   static setMCEConfigContentStyle(editorContentEl)
   {
      const cssBodyInlineStyles = {};

      // Get current CSS variables for editor content and set it to inline styles for the MCE editor iFrame.
      const styles = globalThis.getComputedStyle(editorContentEl);

      for (const entry of this.#s_CSS_VARS_EDITOR)
      {
         const currentPropertyValue = styles.getPropertyValue(entry.variable);
         cssBodyInlineStyles[entry.property] = currentPropertyValue !== '' ? currentPropertyValue : entry.default;
      }

      return `body { ${Object.entries(cssBodyInlineStyles).map(
       (array) => `${array[0]}: ${array[1]};`).join(';')} } p:first-of-type { margin-top: 0; }`;
   }
}

import { striptags } from '@typhonjs-svelte/lib/util';
import {FVTTVersion} from "../../../internal/FVTTVersion.js";
import {FontManager} from "../../../internal/FontManager.js";

export class TinyMCEImpl
{
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

   static keydownHandler(editor, event, options, saveEditor, content)
   {
      switch (event.key)
      {
         case 'Enter':
            // Handles `preventEnterKey` option.
            if (TinyMCEImpl.hasEnterKeyHandler(options))
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
    * Retrieves Foundry default fonts on v10+ and appends any custom fonts into the TinyMCE format.
    *
    * @returns {string} TinyMCE formatted font family string.
    */
   static getFontFormats()
   {
      let fvttFonts = FVTTVersion.isV10 ? FontConfig.getAvailableFonts() : CONFIG.fontFamilies;

      fvttFonts = fvttFonts.map((family) =>`${family}=${family}`);

      return fvttFonts.sort().join(';');
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
}

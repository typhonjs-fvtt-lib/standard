import { processHTML }  from '#runtime/util/html';
import { striptags }    from '#runtime/util/html/striptags';
import { isObject }     from '#runtime/util/object';

import {
   FontManager,
   FVTTVersion }     from '#standard/fvtt';

export class MCEImpl
{
   /**
    * Stores the CSS variable data that is inspected on the `.editor-content` div before the editor is active and
    * copies these values if set or the default values to the body element of the TinyMCE IFrame.
    *
    * @type {object[]}
    */
   static #s_CSS_VARS_EDITOR_BODY = [
      { variable: '--tjs-editor-content-color', property: 'color', default: '#000' },
      { variable: '--tjs-editor-content-font-family', property: 'font-family', default: 'Signika' },
      { variable: '--tjs-editor-content-font-size', property: 'font-size', default: '10.5pt' },
      { variable: '--tjs-editor-content-line-height', property: 'line-height', default: '1.2' },
      { variable: '--tjs-editor-content-padding', property: 'padding', default: '3px 0 0 0' }
   ];

   /**
    * Stores the CSS variable data that is inspected on the `.editor-content` div before the editor is active and
    * copies these values if set or the default values to the body element of the TinyMCE IFrame.
    *
    * @type {object[]}
    */
   static #s_CSS_VARS_EDITOR_HTML = [
      { variable: '', property: 'scrollbar-width', default: 'none' },
      { variable: '', property: 'scrollbar-color', default: 'red' }
   ];

   /**
    * Defines a regex to check for the shape of a raw Foundry document UUID.
    *
    * @type {RegExp}
    */
   static #s_UUID_REGEX = /(\.).*([a-zA-Z0-9]{16})/;

   /**
    * Modifies editor content HTML to add random IDs to secret section blocks that don't presently have an ID
    * assigned. This is done on saving the content such that it interacts with the Foundry DocumentSheet and the
    * `mountRevealSecretsButton` action. TinyMCEs `style_formats` does not have a way to set an ID on the containing
    * block.
    *
    * @param {string}   html - Editor content to modify.
    */
   static addSecretIDs(html)
   {
      return processHTML({
         html,
         process: (element) => element.id = `secret-${foundry.utils.randomID()}`,
         selector: 'section.secret:not([id])'
      });
   }

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
       (typeof options.saveOnEnterKey === 'boolean' && options.saveOnEnterKey);
   }

   static keydownHandler(editor, event, options, saveEditor, content)
   {
      switch (event.code)
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
         // a deferral to the next macrotask.
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
    * @param { {[key: string]: fvtt.FontFamilyDefinition} }  [extraFonts] - Extra user defined fonts to load.
    *
    * @returns { {fonts: {[key: string]: fvtt.FontFamilyDefinition}[], fontFormats: string} } Font formats for
    *          MCE & all fonts to load.
    */
   static getFontData(extraFonts = {})
   {
      if (!isObject(extraFonts)) { throw new TypeError(`'extraFonts' is not an object.`); }

      // TODO Sanitize / confirm extraFonts data / add `editor` field if missing.

      /**
       * @type { {[key: string]: fvtt.FontFamilyDefinition}[] }
       */
      const fonts = [
         ...FontManager.getCoreDefinitions(),
         extraFonts
      ];

      // Process font family definitions to create the font format string for TinyMCE. Remove duplicates.

      /** @type {Set<string>} */
      const fontFormatSet = new Set();

      for (const definitions of fonts)
      {
         if (isObject(definitions))
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
    * Handles paste preprocessing. Prevents pasting when `options.preventPaste` is true. Prevents pasting when
    * `options.maxContentLength` is set and only partially pastes text to fit within the max length.
    *
    *
    * For Foundry v10 and above when `options.maxContentLength` is not defined pasted text is examined for the shape
    * of a raw UUID and if detected attempts to retrieve the document and if found will generate a proper document link
    * from it. You can get the raw UUID by context-clicking the icon in the app header bar for various documents.
    *
    * @param {object}   editor -
    *
    * @param {object}   args -
    *
    * @param {object}   options -
    *
    * @param {number}   maxCharacterLength -
    */
   static pastePreprocess(editor, args, options, maxCharacterLength)
   {
      // Prevent paste if content is not a string or `preventPaste` option is active.
      if (typeof args.content !== 'string' || (typeof options.preventPaste === 'boolean' && options.preventPaste))
      {
         args.stopImmediatePropagation();
         args.stopPropagation();
         args.preventDefault();
      }

      // Must handle pasted text as plain text for max content length. No automatic conversion of raw UUIDs.
      if (maxCharacterLength >= 0)
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
      else // Evaluate pasted text that is a raw UUID and convert it to a document link.
      {
         let text = args.content;

         // Check if pasted test matches the shape of a UUID. If so do a lookup and if a document is retrieved build
         // a UUID.
         if (FVTTVersion.isAtLeast(10) && this.#s_UUID_REGEX.test(text))
         {
            try
            {
               const uuidDoc = globalThis.fromUuidSync(text);
               if (uuidDoc)
               {
                  text = `@UUID[${text}]{${uuidDoc.name}}`;
               }
            }
            catch (err) { /* noop */ }
         }

         args.content = text;
      }
   }

   /**
    * Sets the initial selection based on `options.initialSelection`.
    *
    * @param {object}   editor - MCE editor.
    *
    * @param {string}   initialSelection - Initial selection option.
    *
    * @param {string}   defaultValue - Default value if initialSelection is invalid.
    */
   static setInitialSelection(editor, initialSelection, defaultValue)
   {
      const type = initialSelection === 'all' || initialSelection === 'end' || initialSelection === 'start' ?
       initialSelection : defaultValue;

      const selection = editor.selection;

      /** @type {HTMLBodyElement} */
      const bodyEl = editor.getBody();

      // Sanity check.
      if (!bodyEl) { return; }

      switch (type)
      {
         case 'all':
            selection.select(bodyEl, true);
            break;

         case 'end':
            selection.select(bodyEl, true);
            selection.collapse(false);
            break;

         case 'start':
            selection.select(bodyEl, true);
            selection.collapse(true);
            break;
      }

      editor.focus();
   }

   /**
    * Copies over the CSS variable data that is inspected on the `.editor-content` div before the editor is active if
    * set or the default values to the body element of the TinyMCE IFrame.
    *
    * @param {HTMLElement} editorContentEl - Editor content element.
    *
    * @returns {string} TinyMCE config `content_style` parameter for .
    */
   static setMCEConfigContentStyle(editorContentEl)
   {
      const cssBodyInlineStyles = {};
      const cssHTMLInlineStyles = {};

      // Get current CSS variables for editor content and set it to inline styles for the MCE editor iFrame.
      const styles = globalThis.getComputedStyle(editorContentEl);

      for (const entry of this.#s_CSS_VARS_EDITOR_BODY)
      {
         const currentVariableValue = styles.getPropertyValue(entry.variable);
         const currentPropertyValue = styles.getPropertyValue(entry.property);

         if (currentVariableValue !== '')
         {
            cssBodyInlineStyles[entry.property] = currentVariableValue;
         }
         else
         {
            cssBodyInlineStyles[entry.property] = currentPropertyValue !== '' ? currentPropertyValue : entry.default;
         }
      }

      for (const entry of this.#s_CSS_VARS_EDITOR_HTML)
      {
         const currentVariableValue = styles.getPropertyValue(entry.variable);
         const currentPropertyValue = styles.getPropertyValue(entry.property);

         if (currentVariableValue !== '')
         {
            cssHTMLInlineStyles[entry.property] = currentVariableValue;
         }
         else
         {
            cssHTMLInlineStyles[entry.property] = currentPropertyValue !== '' ? currentPropertyValue : entry.default;
         }
      }

      return `html { ${Object.entries(cssHTMLInlineStyles).map((array) => `${array[0]}: ${array[1]}`).join(';')
       } } body { ${Object.entries(cssBodyInlineStyles).map((array) => `${array[0]}: ${array[1]}`).join(';')
        } } p:first-of-type { margin-top: 0; } section.secret p:first-of-type { margin-top: 0.5em; }`;
   }
}

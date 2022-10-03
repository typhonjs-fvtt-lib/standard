import { stripHtml } from '@typhonjs-fvtt/svelte-standard/util';

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
         let content = stripHtml(args.content);

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

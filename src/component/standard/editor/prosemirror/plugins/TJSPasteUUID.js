// TODO: Foundry v10.287 finally added `Plugin`, but is missing `PluginKey` from exports, so include them here.
import { Plugin, PluginKey } from 'prosemirror-state';

/**
 * A ProseMirror plugin to transform pasted text that is a raw document UUID into a document link suitable for
 * `TextEditor.enrichHTML`.
 */
export class TJSPasteUUID
{
   /**
    * Defines a regex to check for the shape of a raw Foundry document UUID.
    *
    * @type {RegExp}
    */
   static #s_UUID_REGEX = /(\.).*([a-zA-Z0-9]{16})/;

   /**
    * @returns {Plugin<any>} PM Plugin.
    */
   static build()
   {
      const instance = new this();
      return new Plugin({
         key: new PluginKey('tjsPasteRawUUID'),
         props: {
            transformPastedText: (text) => instance.#transformUUID(text)
         }
      });
   }

   /**
    * Transforms pasted text. Check if pasted test matches the shape of a raw UUID. If so do a lookup and if a
    * document is retrieved transform it to a document link.
    *
    * @param {string}   text - pasted text to transform.
    *
    * @returns {string} Potentially transformed pasted text.
    */
   #transformUUID(text)
   {
      if (typeof text === 'string')
      {
         if (TJSPasteUUID.#s_UUID_REGEX.test(text))
         {
            const uuidDoc = globalThis.fromUuidSync(text);
            if (uuidDoc)
            {
               text = `@UUID[${text}]{${typeof uuidDoc.name === 'string' ? uuidDoc.name : 'Unknown'}}`;
            }
         }
      }

      return text;
   }
}

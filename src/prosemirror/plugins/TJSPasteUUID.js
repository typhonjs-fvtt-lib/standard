// Protect for absent global `ProseMirror` on Foundry v9.
const Plugin = globalThis.ProseMirror ? globalThis.ProseMirror.Plugin : class {};
const PluginKey = globalThis.ProseMirror ? globalThis.ProseMirror.PluginKey : class {};

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
    * @returns {Plugin} PM Plugin.
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
         try
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
         catch (err) { /* noop */ }
      }

      return text;
   }
}

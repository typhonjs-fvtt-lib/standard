/**
 * Provides an additional key mapping to `Mod-q` to destroy the editor.
 */
export class TJSProseMirrorKeyMaps extends ProseMirror.ProseMirrorKeyMaps
{
   #onQuit;

   /**
    * @param {Schema}   schema - The ProseMirror schema to build keymaps for.

    * @param {object}   [options] - Additional options to configure the plugin's behaviour.
    *
    * @param {Function} [options.onSave] - A function to call when Ctrl+S is pressed.
    *
    * @param {Function} [options.onQuit] - A function to call when Ctrl+Q is pressed.
    */
   constructor(schema, options)
   {
      super(schema, options);

      if (typeof options.onQuit === 'function')
      {
         this.#onQuit = options.onQuit;
      }
   }

   buildMapping() {
      const mapping = super.buildMapping()

      // Add onQuit callback if defined.
      if (this.#onQuit)
      {
         mapping['Mod-q'] = this.#onQuit;
      }

      return mapping;
   }
}

/**
 * Provides helper utilities to manipulate the PM editor view for various options from TJSProseMirror component.
 */
export class PMImpl
{
   /**
    * Clamps a value between min / max values.
    *
    * @param {number}   value - Value to clamp.
    *
    * @param {number}   min - Minimum value.
    *
    * @param {number}   max - Maximum value.
    *
    * @returns {number} Clamped value.
    * TODO: Move Math utility function to @typhonjs-svelte/lib
    */
   static #clamp(value = 0, min = 0, max = 0)
   {
      return Math.min(Math.max(value, min), max);
   }

   /**
    * Handles `options.initialSelection`: Sets the initial cursor / selection range to the start, end, or selects
    * all text.
    *
    * @param {EditorView}  view - PM editor view.
    *
    * @param {object}  options - TJSProseMirror options.
    */
   static setInitialSelection(view, options)
   {
      const tr = view.state.tr;
      const doc = tr.doc;

      const initialSelection = options.initialSelection;

      const type = initialSelection === 'all' || initialSelection === 'end' || initialSelection === 'start' ?
       initialSelection : 'start';

      const minPos = globalThis.ProseMirror.TextSelection.atStart(doc).from;
      const maxPos = globalThis.ProseMirror.TextSelection.atEnd(doc).to;

      let transaction;

      switch (type)
      {
         case 'all':
         {
            const resolvedFrom = this.#clamp(0, minPos, maxPos);
            const resolvedEnd = this.#clamp(doc.content.size, minPos, maxPos);
            transaction = tr.setSelection(globalThis.ProseMirror.TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }

         case 'end':
         {
            const resolvedFrom = this.#clamp(doc.content.size, minPos, maxPos);
            const resolvedEnd = this.#clamp(doc.content.size, minPos, maxPos);
            transaction = tr.setSelection(globalThis.ProseMirror.TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }

         case 'start':
         {
            const resolvedFrom = this.#clamp(0, minPos, maxPos);
            const resolvedEnd = this.#clamp(0, minPos, maxPos);
            transaction = tr.setSelection(globalThis.ProseMirror.TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }
      }

      if (transaction)
      {
         transaction.scrollIntoView();

         view.dispatch(transaction);
      }
   }
}

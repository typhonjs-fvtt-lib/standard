import { clamp } from '#runtime/math/util';

/**
 * Provides helper utilities to manipulate the PM editor view for various options from TJSProseMirror component.
 */
export class PMImpl
{
   /**
    * Handles `options.initialSelection`: Sets the initial cursor / selection range to the start, end, or selects
    * all text.
    *
    * @param {globalThis.EditorView}  view - PM editor view.
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
            const resolvedFrom = clamp(0, minPos, maxPos);
            const resolvedEnd = clamp(doc.content.size, minPos, maxPos);
            transaction = tr.setSelection(globalThis.ProseMirror.TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }

         case 'end':
         {
            const resolvedFrom = clamp(doc.content.size, minPos, maxPos);
            const resolvedEnd = clamp(doc.content.size, minPos, maxPos);
            transaction = tr.setSelection(globalThis.ProseMirror.TextSelection.create(doc, resolvedFrom, resolvedEnd));
            break;
         }

         case 'start':
         {
            const resolvedFrom = clamp(0, minPos, maxPos);
            const resolvedEnd = clamp(0, minPos, maxPos);
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

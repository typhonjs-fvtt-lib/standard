/**
 * Provides an action to enable selection dragging that creates events for start,change,end
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @param {boolean}           [params.constrain=true] - Constrains selection to origin and width of node.
 *
 * @param {boolean}           [params.capture=false] - Capture pointer events.
 *
 * @param {string}            [params.background='rgba(255, 0, 0, 0.3)'] - A valid CSS background style string.
 *
 * @param {number}            [params.width=2] - Width of selection box in pixels.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */
export function selection(node, { active = true, constrain = true, capture = false,
 background = 'rgba(255, 255, 255, 0.5)', width = 2 } = {})
{
   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   const initialDragPoint = { x: 0, y: 0 };

   const selectionRect = new DOMRect();

   let dragging = false;

   /**
    * @type {HTMLElement}
    */
   let spanEl;

   /**
    * Remember event handlers associated with this action so they may be later unregistered.
    *
    * @type {object}
    */
   const handlers = {
      dragDown: ['pointerdown', (e) => onDragPointerDown(e), false],
      dragChange: ['pointermove', (e) => onDragPointerChange(e), false],
      dragUp: ['pointerup', (e) => onDragPointerUp(e), false]
   };

   /**
    * Activates listeners.
    */
   function activateListeners()
   {
      // Drag handlers
      node.addEventListener(...handlers.dragDown);
   }

   /**
    * Removes listeners.
    */
   function removeListeners()
   {
      // Drag handlers
      node.removeEventListener(...handlers.dragDown);
      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the selection box.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      if (event.target !== node) { return; }
      if (event.button !== 0 || !event.isPrimary) { return; }

      if (capture) { event.preventDefault(); event.stopPropagation(); }

      const nodeRect = node.getBoundingClientRect();

      selectionRect.x = initialDragPoint.x = event.clientX - nodeRect.left;
      selectionRect.y = initialDragPoint.y = event.clientY - nodeRect.top;
      selectionRect.width = 0;
      selectionRect.height = 0;

      if (constrain)
      {
         if (selectionRect.x < 0) { selectionRect.x = 0; }
         if (selectionRect.y < 0) { selectionRect.x = 0; }
      }

      dragging = false;

      // Add move and pointer up handlers.
      node.addEventListener(...handlers.dragChange);
      node.addEventListener(...handlers.dragUp);

      node.setPointerCapture(event.pointerId);

      node.dispatchEvent(new CustomEvent('selection:start', { bubbles: false }));
   }

   /**
    * Change selection.
    *
    * @param {PointerEvent} event - The pointer move event.
    */
   function onDragPointerChange(event)
   {
      // See chorded button presses for pointer events:
      // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
      if ((event.buttons & 1) === 0)
      {
         onDragPointerUp(event);
         return;
      }

      if (capture) { event.preventDefault(); event.stopPropagation(); }

      const nodeRect = node.getBoundingClientRect();

      /** @type {number} */
      selectionRect.width = event.clientX - initialDragPoint.x - nodeRect.left;
      selectionRect.height = event.clientY - initialDragPoint.y - nodeRect.top;

      if (constrain)
      {
         const bottom = nodeRect.bottom - nodeRect.top;
         const right = nodeRect.right - nodeRect.left;

         if (selectionRect.left < 0) { selectionRect.width += selectionRect.width >= 0 ? selectionRect.left : -selectionRect.left; }
         if (selectionRect.top < 0) { selectionRect.height += selectionRect.height >= 0 ? selectionRect.top : -selectionRect.top; }

         if (selectionRect.right > right) { selectionRect.width += selectionRect.width >= 0 ? right - selectionRect.right : -(right - selectionRect.right); }
         if (selectionRect.bottom > bottom) { selectionRect.height += selectionRect.height >= 0 ? bottom - selectionRect.bottom : -(bottom - selectionRect.bottom); }
      }

      if (!dragging && (selectionRect.width !== 0 || selectionRect.height !== 0))
      {
         spanEl = document.createElement('span');

         spanEl.style.position = 'absolute';
         spanEl.style.background = `var(--tjs-action-selection-background, ${background})`;
         spanEl.style.pointerEvents = 'none';
         spanEl.style.clipPath = `polygon(0% 0%, 0% 100%, ${width}px 100%, ${width}px ${width}px, calc(100% - ${width}px) ${width}px, calc(100% - ${width}px) calc(100% - ${width}px), ${width}px calc(100% - ${width}px), ${width}px 100%, 100% 100%, 100% 0%)`;
         spanEl.style.zIndex = `${Number.MAX_SAFE_INTEGER}`;

         dragging = true;

         node.append(spanEl);
      }

      if (spanEl)
      {
         spanEl.style.width = `${selectionRect.right - selectionRect.left}px`;
         spanEl.style.height = `${selectionRect.bottom - selectionRect.top}px`;
         spanEl.style.left = `${selectionRect.left}px`;
         spanEl.style.top = `${selectionRect.top}px`;
      }

      node.dispatchEvent(new CustomEvent('selection:change', {
         detail: { rect: DOMRectReadOnly.fromRect(selectionRect) },
         bubbles: false
      }));
   }

   /**
    * Finish dragging and send completion event.
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      if (capture) { event.preventDefault(); event.stopPropagation(); }

      if (spanEl)
      {
         spanEl.remove();
         spanEl = void 0;
      }

      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);

      if (dragging)
      {
         node.dispatchEvent(new CustomEvent('selection:end', {
            detail: {
               ctrlKey: event.ctrlKey,
               shiftKey: event.shiftKey,
               metaKey: event.metaKey,
               rect: DOMRectReadOnly.fromRect(selectionRect)
            },
            bubbles: false
         }));
      }

      dragging = false;
   }

   return {
      // The default of active being true won't automatically add listeners twice.
      update: (options) =>
      {
         if (typeof options.active === 'boolean')
         {
            active = options.active;
            if (active) { activateListeners(); }
            else
            {
               dragging = false;

               if (spanEl)
               {
                  spanEl.remove();
                  spanEl = void 0;
               }

               removeListeners();
            }
         }
      },

      destroy: () => removeListeners()
   };
}
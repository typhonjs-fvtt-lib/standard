/**
 * Provides an action to enable pointer dragging that tracks relative changes. Sends data to
 * {@link ControlsStore.dragging}.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */
export function draggable(node, { active = true })
{
   /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */
   const initialDragPoint = { x: 0, y: 0 };

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

      node.style.cursor = null;
   }

   if (active)
   {
      activateListeners();
   }

   /**
    * Handle the initial pointer down that activates dragging behavior for the positionable.
    *
    * @param {PointerEvent} event - The pointer down event.
    */
   function onDragPointerDown(event)
   {
      if (event.button !== 0 || !event.isPrimary) { return; }

      event.preventDefault();

      // Record initial position.
      initialDragPoint.x = event.clientX;
      initialDragPoint.y = event.clientY;

      // Add move and pointer up handlers.
      node.addEventListener(...handlers.dragChange);
      node.addEventListener(...handlers.dragUp);

      node.setPointerCapture(event.pointerId);

      node.style.cursor = 'grabbing';

      node.dispatchEvent(new CustomEvent('draggable:start', { bubbles: false }));
   }

   /**
    * Move the positionable.
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

      event.preventDefault();

      const tX = event.clientX - initialDragPoint.x;
      const tY = event.clientY - initialDragPoint.y;

      node.dispatchEvent(new CustomEvent('draggable:move', { detail: { tX, tY }, bubbles: false }));
   }

   /**
    * Finish dragging and set the final position and removing listeners.
    *
    * @param {PointerEvent} event - The pointer up event.
    */
   function onDragPointerUp(event)
   {
      event.preventDefault();

      node.removeEventListener(...handlers.dragChange);
      node.removeEventListener(...handlers.dragUp);

      node.style.cursor = null;

      node.dispatchEvent(new CustomEvent('draggable:end', { bubbles: false }));
   }

   return {
      // The default of active being true won't automatically add listeners twice.
      update: (options) =>
      {
         if (typeof options.active === 'boolean')
         {
            active = options.active;
            if (active) { activateListeners(); }
            else { removeListeners(); }
         }
      },

      destroy: () => removeListeners()
   };
}
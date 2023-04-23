import { writable }        from 'svelte/store';

import { propertyStore }   from '#runtime/svelte/store';

import { TJSPosition }     from '#runtime/svelte/store/position';

export class ControlStore
{
   #component;

   #data = {
      isPrimary: false,
      resizing: false,
      selected: false
   };

   #position;

   #stores;

   /**
    * @type {Function[]}
    */
   #unsubscribe = [];

   constructor(component)
   {
      this.#component = component;

      // To accomplish bidirectional updates Must ignore updates from the control position when set from the
      // target component position.
      let ignoreRoundRobin = false;

      this.#position = TJSPosition.duplicate(component.position, { calculateTransform: true });

      /**
       * Update component position, but only when ignoring round-robin callback.
       */
      this.#unsubscribe.push(this.#position.subscribe((data) =>
      {
         if (!ignoreRoundRobin)
         {
            component.position.set({ ...data, immediateElementUpdate: true });
         }
      }));

      /**
       * Sets the local control position store, but temporarily sets ignoreRoundRobin callback;
       */
      this.#unsubscribe.push(component.position.subscribe((data) =>
      {
         ignoreRoundRobin = true;
         this.#position.set({ ...data, immediateElementUpdate: true });
         ignoreRoundRobin = false;
      }));

      const dataStore = writable(this.#data);

      this.#stores = {
         isPrimary: propertyStore(dataStore, 'isPrimary'),
         resizing: propertyStore(dataStore, 'resizing'),
         selected: propertyStore(dataStore, 'selected')
      };

      Object.freeze(this.#stores);
   }

   get component() { return this.#component; }

   get id() { return this.#component.id; }

   get isPrimary() { return this.#data.isPrimary; }

   /**
    * @returns {TJSPosition} Control position.
    */
   get position() { return this.#position; }

   get resizing() { return this.#data.resizing; }

   get selected() { return this.#data.selected; }

   get stores() { return this.#stores; }

   set isPrimary(isPrimary)
   {
      this.#stores.isPrimary.set(isPrimary);
   }

   set resizing(resizing)
   {
      this.#stores.resizing.set(resizing);
   }

   set selected(selected)
   {
      this.#stores.selected.set(selected);
   }

   /**
    * Cleans up all subscriptions and removes references to tracked component data.
    */
   destroy()
   {
      for (const unsubscribe of this.#unsubscribe) { unsubscribe(); }

      this.#unsubscribe = void 0;
      this.#component = void 0;
      this.#position = void 0;
   }
}

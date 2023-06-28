/**
 * Defines a base class for dispatch handling from events triggered from the TJSGameSettings plugin. This is a
 * convenience mechanism and is not the only way to handle game settings related events. Use this for small to medium
 * scoped apps that do not have a lot of cross-cutting concerns.
 *
 * TJSGameSettingsControl listens for all setting change events and attempts to invoke a method with the same name as the
 * setting located in the implementing child class.
 *
 * There is one additional event handled by TJSGameSettingsControl:
 * `tjs:system:settings:control:log:enable` - When passed a truthy value console logging of setting changes occurs.
 */
export class TJSPGameSettingsControl
{
   /**
    * Defines if logging setting changes to the console occurs.
    *
    * @type {boolean}
    */
   #loggingEnabled = false;

   #handleDispatch(data)
   {
      if (typeof data.setting !== 'string') { return; }

      if (this.#loggingEnabled)
      {
         console.log(`TJSGameSettingsControl - handleDispatch - data:\n`, data);
      }

      const dispatchFunction = this[data.setting];

      if (typeof dispatchFunction === 'function')
      {
         dispatchFunction.call(this, data.value);
      }
   }

   onPluginLoad(ev)
   {
      this._eventbus = ev.eventbus;

      const opts = { guard: true };

      ev.eventbus.on('tjs:system:game:settings:change:any', this.#handleDispatch, this, opts);

      // Enables local logging of setting changes.
      ev.eventbus.on('tjs:system:settings:control:log:enable', (enabled) => this.#loggingEnabled = enabled, void 0,
       opts);
   }
}

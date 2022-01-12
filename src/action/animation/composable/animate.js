import { debounce as debounceFn } from '@typhonjs-svelte/lib/util';

/**
 * Defines an `Element.animate` animation from provided keyframes and options.
 *
 * @param {object}         [opts] - Optional parameters.
 *
 * @param {number}         [opts.duration=600] - Duration in milliseconds.
 *
 * @param {Array|object}   opts.keyframes - An array of keyframe objects or a keyframe object whose properties are
 *                                          arrays of values to iterate over.
 *
 * @param {object}         [opts.options] - An object containing one or more timing properties. When defined it is used
 *                                          instead of duration.
 *
 * @param {string}         [opts.event='click'] - DOM event to bind element to respond with the ripple effect.
 *
 * @param {number}         [opts.debounce=undefined] - Add a debounce to incoming events in milliseconds.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/animate
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats
 *
 * @returns Function - Actual action.
 */
export function animate({ duration = 600, keyframes = [], options, event = 'click', debounce } = {})
{
   return (element) =>
   {
      function createAnimation() {
         element.animate(keyframes, typeof options === 'object' && options !== null ? options : duration);
      }

      const eventFn = Number.isInteger(debounce) && debounce > 0 ? debounceFn(createAnimation, debounce) :
       createAnimation;

      element.addEventListener(event, eventFn);

      return {
         destroy: () => element.removeEventListener(event, eventFn)
      };
   }
}

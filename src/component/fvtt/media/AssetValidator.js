/**
 * Provides a utility to validate media file types and determine the appropriate HTML element type for rendering.
 *
 * TODO: This is the initial implementation and is only used locally in {@link TJSMediaContent}.
 * I'd like to take a second pass and strengthen the support to accept URLs as well as file path strings.
 */
export class AssetValidator
{
   /** Supported media types. */
   static #allMediaTypes = new Set(['audio', 'img', 'video']);

   /** Supported audio extensions. */
   static #audioExtensions = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'webm']);

   /** Supported image extensions. */
   static #imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']);

   /** Supported video extensions. */
   static #videoExtensions = new Set(['mp4', 'webm', 'ogg']);

   /**
    * Parses the provided file path to determine the media type and validity based on the file extension. Certain
    * extensions can be excluded in addition to filtering by specified media types.
    *
    * @param {object}      options - Options.
    *
    * @param {string}      options.filepath - The file path of the media asset to validate.
    *
    * @param {Set<string>} [options.exclude] - A set of file extensions to exclude from validation.
    *
    * @param {Set<('audio' | 'img' | 'video')>} [options.mediaTypes] - A set of media types to validate against
    *        including: `audio`, `img`, `video`. Defaults to all media types if not specified.
    *
    * @param {boolean}     [options.raiseException] - When true exceptions are thrown.
    *
    * @returns {object} The parsed asset information containing the file path, extension, element type, and whether
    *          the parsing is valid for the file extension is supported and not excluded.
    *          TODO: create type information when made public.
    *
    * @throws {TypeError} If the provided `filepath` is not a string, `exclude` is not a Set, or `mediaTypes` is not a
    *         Set.
    */
   static parseMedia({ filepath, exclude, mediaTypes = this.#allMediaTypes, raiseException = false })
   {
      const throws = typeof raiseException === 'boolean' ? raiseException : true;

      if (typeof filepath !== 'string')
      {
         if (throws) { throw new TypeError(`'filepath' is not a string.`); }
         else { return { filepath, valid: false }; }
      }

      if (exclude !== void 0 && !(exclude instanceof Set))
      {
         if (throws) { throw new TypeError(`'exclude' is not a Set.`); }
         else { return { filepath, valid: false }; }
      }

      if (!(mediaTypes instanceof Set))
      {
         if (throws) { throw new TypeError(`'mediaTypes' is not a Set.`); }
         else { return { filepath, valid: false }; }
      }

      const extensionMatch = filepath.match(/\.([a-zA-Z0-9]+)$/);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : null;

      const isExcluded = exclude instanceof Set ? exclude.has(extension) : false;

      let elementType = null;
      let valid = false;

      if (extension && !isExcluded)
      {
         if (this.#imageExtensions.has(extension) && mediaTypes.has('img'))
         {
            elementType = 'img';
            valid = true;
         }
         else if (this.#videoExtensions.has(extension) && mediaTypes.has('video'))
         {
            elementType = 'video';
            valid = true;
         }
         else if (this.#audioExtensions.has(extension) && mediaTypes.has('audio'))
         {
            elementType = 'audio';
            valid = true;
         }
      }

      return {
         filepath,
         extension,
         elementType,
         valid
      };
   }
}

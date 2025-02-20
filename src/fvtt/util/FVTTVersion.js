/**
 * Provides a helper class to determine the version of the Foundry platform starting a version `9`.
 *
 * Note: You must use any of these utility methods after the Foundry `init` hook.
 */
export class FVTTVersion
{
   static #regexMajorVersion = /(\d+)\./;

   /**
    * Returns true when Foundry is at least the specific major version number provided.
    *
    * Note: `game` must be initialized for correct comparison; use after Foundry `init` hook.
    *
    * @param {number}   version - Major version to check against.
    *
    * @returns {boolean} Foundry version is at least the major version specified.
    */
   static isAtLeast(version)
   {
      if (globalThis.game?.version === void 0)
      {
         throw new Error(`FVTTVersion.isAtLeast error: Foundry VTT global 'game' object is not initialized.`);
      }

      if (!Number.isInteger(version) && version < 9)
      {
         throw new TypeError(`'version' is not a positive integer greater than or equals '9'.`);
      }

      return !globalThis.foundry.utils.isNewerVersion(version, globalThis.game.version);
   }

   /**
    * Returns true when Foundry is inclusively between the min / max major version numbers provided.
    *
    * @param {number}   min - Major minimum version to check against.
    *
    * @param {number}   max - Major maximum version to check against.
    *
    * @returns {boolean} Foundry version is at least the major version specified.
    */
   static isBetween(min, max)
   {
      if (globalThis.game?.version === void 0)
      {
         throw new Error(`FVTTVersion.isBetween error: Foundry VTT global 'game' object is not initialized.`);
      }

      if (!Number.isInteger(min) && min < 9)
      {
         throw new TypeError(
          `FVTTVersion.isBetween error: 'min' is not a positive integer greater than or equals '9'.`);
      }

      if (!Number.isInteger(max) && max < 9)
      {
         throw new TypeError(
          `FVTTVersion.isBetween error: 'max' is not a positive integer greater than or equals '9'.`);
      }

      if (min > max)
      {
         throw new TypeError(`FVTTVersion.isBetween error: 'min' is greater than 'max'.`);
      }

      const match = this.#regexMajorVersion.exec(globalThis.game.version);
      if (!match)
      {
         throw new Error(`FVTTVersion.isBetween error: Could not parse 'globalThis.game.version'.`);
      }

      const version = parseInt(match[1], 10);

      return version >= min && version <= max;
   }
}

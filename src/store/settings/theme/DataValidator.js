import { isObject }  from '#runtime/svelte/util';

import { getFormat } from '@typhonjs-fvtt/runtime/color/colord';

export class DataValidator
{
   /**
    * This regex tests for correct CSS variable names according to the CSS specification.
    *
    * @type {RegExp}
    *
    * @see https://www.w3.org/TR/css-variables-1/#defining-variables
    * @see https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
    */
   static #REGEX_CSS_VAR_NAME =
    /--(?:[_a-zA-Z\u00A0-\uFFFF]|\\[0-9a-fA-F]{1,6})(?:[\w\u00A0-\uFFFF-]|\\[0-9a-fA-F]{1,6})*/;

   static #SET_TYPES = new Set(['color']);

   /**
    * Parses and verifies a component entry.
    *
    * @param {TJSThemeStoreComponent} entry - A component entry.
    *
    * @param {number}   cntr - Current component entry counter.
    *
    * @returns {object} Parsed and verified component entry.
    */
   static componentEntry(entry, cntr)
   {
      const result = Object.assign({}, entry);

      if (!isObject(entry))
      {
         throw new TypeError(`TJSThemeStore initialize error: data[${cntr}] entry is not an object.`);
      }

      if (typeof entry.label !== 'string')
      {
         throw new Error(
          `TJSThemeStore initialize error: data[${cntr}] 'entry.label' is not a string.`);
      }

      if (typeof entry.type !== 'string')
      {
         throw new Error(
          `TJSThemeStore initialize error: data[${cntr}] 'entry.type' is not a string.`);
      }

      if (!this.#SET_TYPES.has(entry.type))
      {
         throw new Error(`TJSThemeStore initialize error: data[${cntr}] 'entry.type' unknown.`);
      }

      if (entry.var !== void 0 && typeof entry.var !== 'string')
      {
         throw new TypeError(`TJSThemeStore initialize error: data[${cntr}] 'entry.var' is not a string.`);
      }

      // Handle common data for CSS variable entries.
      if (typeof entry.var === 'string')
      {
         // Test for valid CSS variable name
         if (!this.#REGEX_CSS_VAR_NAME.test(entry.var))
         {
            throw new Error(
             `TJSThemeStore initialize error: data[${cntr}] 'entry.var' is not a valid CSS variable name.`);
         }

         if (typeof entry.default !== 'string')
         {
            throw new TypeError(`TJSThemeStore initialize error: data[${cntr}] 'entry.default' is not a string.`);
         }
      }

      switch (entry.type)
      {
         case 'color':
         {
            // Verify that default value is a supported color format.
            const format = getFormat(entry.default);
            if (!format)
            {
               throw new Error(`TJSThemeStore initialize error: data[${cntr}] 'entry.default' unknown color format.`);
            }

            // Add the color format to entry result data.
            result.format = format;
            break;
         }
      }

      return result;
   }
}

/**
 * A utility class to work with semantic versioning.
 */
export class SemVer
{
   /**
    * Regular expression to parse a semantic version string capturing: major, minor, patch, prerelease, and build
    * metadata segments.
    *
    * @type {RegExp}
    */
   static #REGEX_SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

   /**
    * Parses a semantic version string and returns a semantic version data object.
    *
    * @param {string}   semver - The semantic version string to parse.
    *
    * @param {object}   [options] - Optional parameters
    *
    * @param {boolean}  [options.exceptions=false] - Throw exception on parse failure.
    *
    * @returns {SemVerData} The parsed semantic version object.
    * @throws {Error} If the input string is not a valid semantic version string.
    */
   static parseSemVer(semver, { exceptions = false } = {})
   {
      if (typeof semver !== 'string') { throw new TypeError(`'semver' is not a string.`); }

      const matches = semver.match(this.#REGEX_SEMVER);

      if (!matches)
      {
         if (exceptions)
         {
            throw new Error(`Invalid semantic versioning string: '${semver}'`);
         }
         else
         {
            return void 0;
         }
      }

      return {
         major: typeof matches?.[1] === 'string' !== void 0 ? parseInt(matches[1], 10) : 0,
         minor: typeof matches?.[2] === 'string' ? parseInt(matches[2], 10) : 0,
         patch: typeof matches?.[3] === 'string' ? parseInt(matches[3], 10) : 0,
         prerelease: typeof matches?.[4] === 'string' ? matches[4] : '',
         build: typeof matches?.[5] === 'string' ? matches[5] : ''
      };
   }

   /**
    * Compares two semantic version strings and returns a comparison result.
    *
    * @param {string} a - The first semantic version string.
    *
    * @param {string} b - The second semantic version string.
    *
    * @returns {number} 1 if a is greater than b, -1 if a is less than b, and 0 if a and b are equal.
    */
   static compareSemVerString(a, b)
   {
      return this.compareSemVerData(this.parseSemVer(a, { exceptions: true }),
       this.parseSemVer(b, { exceptions: true }));
   }

   /**
    * Compares two parsed semantic version objects and returns a comparison result.
    *
    * @param {SemVerData} a - The first parsed semantic version object.
    *
    * @param {SemVerData} b - The second parsed semantic version object.
    *
    * @returns {number} 1 if a is greater than b, -1 if a is less than b, and 0 if a and b are equal.
    */
   static compareSemVerData(a, b)
   {
      const majorA = a.major;
      const majorB = b.major;
      const minorA = a.minor;
      const minorB = b.minor;
      const patchA = a.patch;
      const patchB = b.patch;

      if (majorA > majorB) { return 1; }
      if (majorA < majorB) { return -1; }

      if (minorA > minorB) { return 1; }
      if (minorA < minorB) { return -1; }

      if (patchA > patchB) { return 1; }
      if (patchA < patchB) { return -1; }

      const prereleaseA = a.prerelease ?? '';
      const prereleaseB = b.prerelease ?? '';

      if (prereleaseA && !prereleaseB) { return -1; }
      if (!prereleaseA && prereleaseB) { return 1; }

      if (prereleaseA && prereleaseB)
      {
         const partsA = prereleaseA.split('.');
         const partsB = prereleaseB.split('.');
         const len = Math.min(partsA.length, partsB.length);

         for (let i = 0; i < len; i++)
         {
            const partA = parseInt(partsA[i], 10);
            const partB = parseInt(partsB[i], 10);

            if (!isNaN(partA) && isNaN(partB)) { return -1; }
            if (isNaN(partA) && !isNaN(partB)) { return 1; }

            if (partA > partB) { return 1; }
            if (partA < partB) { return -1; }

            if (isNaN(partA) && isNaN(partB))
            {
               if (partsA[i] > partsB[i]) { return 1; }
               if (partsA[i] < partsB[i]) { return -1; }
            }
         }

         if (partsA.length > partsB.length) { return 1; }
         if (partsA.length < partsB.length) { return -1; }
      }

      return 0;
   }
}

/**
 * @typedef {object} SemVerData
 *
 * @property {number} major - The major version number as a string.
 *
 * @property {number} minor - The minor version number as a string.
 *
 * @property {number} patch - The patch version number as a string.
 *
 * @property {string} prerelease - The prerelease version identifier as a string, or an empty string if not present.
 *
 * @property {string} build - The build metadata identifier as a string, or an empty string if not present.
 */

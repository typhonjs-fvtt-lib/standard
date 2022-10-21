import { externalPathsNPM }      from './externalPathsNPM.js';

import { generatePlugin }        from '../generatePlugin.js';

/**
 * Creates the TyphonJS runtime library substitution plugin.
 *
 * @param {string[]} [exclude] - NPM packages to exclude from predefined list of packages.
 *
 * @param {boolean}  [output=false] - Configure as output plugin; Rollup 3 posts warnings for a dual input / output
 *                                    plugin.
 *
 * @returns {{name: string, options(*): void}} TyphonJS runtime plugin
 */
export function typhonjsRuntime({ exclude = [], output = false } = {})
{
   return generatePlugin(externalPathsNPM, exclude, output);
}

import alias               from '@rollup/plugin-alias';
import resolve             from '@rollup/plugin-node-resolve';
import { generateTSDef }   from '@typhonjs-build-test/esm-d-ts';
import { getFileList }     from '@typhonjs-utils/file-util';
import fs                  from 'fs-extra';
import { rollup }          from 'rollup';
import sourcemaps          from 'rollup-plugin-sourcemaps';
import { terser }          from 'rollup-plugin-terser';
import upath               from 'upath';

import { typhonjsRuntime } from './.rollup/local/index.js';

import terserConfig        from './terser.config.mjs';

const s_COMPRESS = false;
const s_SOURCEMAPS = true;

// Defines Svelte and all local exports as external.
const s_LOCAL_EXTERNAL = [
   'svelte', 'svelte/easing', 'svelte/internal', 'svelte/motion', 'svelte/store', 'svelte/transition',
   'svelte/types',

   '@typhonjs-fvtt/svelte-standard/action', '@typhonjs-fvtt/svelte-standard/component'
];

// Defines potential output plugins to use conditionally if the .env file indicates the bundles should be
// minified / mangled.
const outputPlugins = s_COMPRESS ? [terser(terserConfig), typhonjsRuntime()] : [typhonjsRuntime()];

// Defines whether source maps are generated / loaded from the .env file.
const sourcemap = s_SOURCEMAPS;

const rollupConfigs = [
   {
      input: {
         input: 'src/action/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            alias({
               entries: [
                  { find: '#internal', replacement: './src/internal/index.js' }
               ]
            }),
            typhonjsRuntime({ exclude: ['@typhonjs-fvtt/svelte-standard/action'] }),
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: '_dist/action/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap
        }
      }
   },
   {
      input: {
         input: 'src/store/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            typhonjsRuntime({ exclude: ['@typhonjs-fvtt/svelte-standard/store'] }),
            resolve(),
            sourcemaps()
         ]
      },
      output: {
         output: {
            file: '_dist/store/index.js',
            format: 'es',
            plugins: outputPlugins,
            preferConst: true,
            sourcemap
         }
      }
   },
];

for (const config of rollupConfigs)
{
   const bundle = await rollup(config.input);
   await bundle.write(config.output);

   // closes the bundle
   await bundle.close();

   await generateTSDef({
      main: config.output.output.file,
      output: upath.changeExt(config.output.output.file, '.d.ts')
   });

   fs.writeJSONSync(`${upath.dirname(config.output.output.file)}/package.json`, {
      main: './index.js',
      module: './index.js',
      type: 'module',
      types: './index.d.ts'
   });
}

// Handle application by copying the source.
fs.emptyDirSync('./_dist/application');
fs.copySync('./src/application', './_dist/application');

fs.writeJSONSync(`./_dist/application/package.json`, {
   main: './index.js',
   module: './index.js',
   type: 'module'
});

await generateTSDef({
   main: './_dist/application/index.js',
   output: './_types/application/index.d.ts'
});

// Handle component/standard by copying the source.
fs.emptyDirSync('./_dist/component');
fs.copySync('./src/component', './_dist/component');

fs.writeJSONSync(`./_dist/component/standard/package.json`, {
   main: './index.js',
   module: './index.js',
   type: 'module'
});

const compFiles = await getFileList({ dir: './_dist/component/standard' });
for (const compFile of compFiles)
{
   let fileData = fs.readFileSync(compFile, 'utf-8').toString();
   fileData = fileData.replaceAll('@typhonjs-fvtt/svelte/', '@typhonjs-fvtt/runtime/svelte/')
   fileData = fileData.replaceAll('@typhonjs-svelte/lib/', '@typhonjs-fvtt/runtime/svelte/')
   fs.writeFileSync(compFile, fileData);
}

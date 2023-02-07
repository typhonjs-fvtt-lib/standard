import alias               from '@rollup/plugin-alias';
import commonjs            from '@rollup/plugin-commonjs';
import resolve             from '@rollup/plugin-node-resolve';
import { generateTSDef }   from '@typhonjs-build-test/esm-d-ts';
import { getFileList }     from '@typhonjs-utils/file-util';
import fs                  from 'fs-extra';
import { rollup }          from 'rollup';
import upath               from 'upath';

import { typhonjsRuntime } from './.rollup/local/index.js';

const s_SOURCEMAPS = true;

// Defines Svelte and all local exports as external.
const s_LOCAL_EXTERNAL = [
   'svelte', 'svelte/easing', 'svelte/internal', 'svelte/motion', 'svelte/store', 'svelte/transition',
   'svelte/types',

   '@typhonjs-fvtt/svelte-standard/action', '@typhonjs-fvtt/svelte-standard/application',
   '@typhonjs-fvtt/svelte-standard/component', '@typhonjs-fvtt/svelte-standard/dev-tools',
   '@typhonjs-fvtt/svelte-standard/plugin/data', '@typhonjs-fvtt/svelte-standard/plugin/system',
   '@typhonjs-fvtt/svelte-standard/prosemirror', '@typhonjs-fvtt/svelte-standard/store',
];

// Defines potential output plugins to use conditionally if the .env file indicates the bundles should be
// minified / mangled.
const outputPlugins = [typhonjsRuntime({ output: true })];

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
            resolve()
         ]
      },
      output: {
         file: '_dist/action/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/dev-tools/prosemirror/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            typhonjsRuntime({ exclude: ['@typhonjs-fvtt/svelte-standard/dev-tools/prosemirror'] }),
            resolve(),
            commonjs()
         ]
      },
      output: {
         file: '_dist/dev-tools/prosemirror/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/plugin/data/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            typhonjsRuntime({ exclude: [`@typhonjs-fvtt/svelte-standard/plugin/data`] }),
            resolve()
         ]
      },
      output: {
         file: '_dist/plugin/data/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         // paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap,
      }
   },
   {
      input: {
         input: 'src/plugin/system/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            typhonjsRuntime({ exclude: [`@typhonjs-fvtt/svelte-standard/plugin/system`] }),
            resolve()
         ]
      },
      output: {
         file: '_dist/plugin/system/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         // paths: externalPathsNPM,
         plugins: outputPlugins,
         sourcemap,
      }
   },
   {
      input: {
         input: 'src/prosemirror/plugins/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            typhonjsRuntime({ exclude: ['@typhonjs-fvtt/svelte-standard/prosemirror/plugins'] }),
            resolve()
         ]
      },
      output: {
         file: '_dist/prosemirror/plugins/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         plugins: outputPlugins,
         sourcemap
      }
   },
   {
      input: {
         input: 'src/store/index.js',
         external: s_LOCAL_EXTERNAL,
         plugins: [
            typhonjsRuntime({ exclude: ['@typhonjs-fvtt/svelte-standard/store'] }),
            resolve()
         ]
      },
      output: {
         file: '_dist/store/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         plugins: outputPlugins,
         sourcemap
      }
   }
];

for (const config of rollupConfigs)
{
   const bundle = await rollup(config.input);
   await bundle.write(config.output);

   // closes the bundle
   await bundle.close();

   await generateTSDef({
      main: config.output.file,
      output: upath.changeExt(config.output.file, '.d.ts')
   });

   fs.writeJSONSync(`${upath.dirname(config.output.file)}/package.json`, {
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

let compFiles = await getFileList({ dir: './_dist/application' });
for (const compFile of compFiles)
{
   let fileData = fs.readFileSync(compFile, 'utf-8').toString();
   fileData = fileData.replaceAll('#runtime/', '@typhonjs-fvtt/runtime/');
   fileData = fileData.replaceAll('@typhonjs-fvtt/svelte/', '@typhonjs-fvtt/runtime/svelte/');
   fileData = fileData.replaceAll('@typhonjs-svelte/lib/', '@typhonjs-fvtt/runtime/svelte/');
   fs.writeFileSync(compFile, fileData);
}

await generateTSDef({
   main: './_dist/application/index.js',
   output: './_types/application/index.d.ts'
});

// Svelte standard components ----------------------------------------------------------------------------------------

// Handle component/standard by copying the source.
fs.emptyDirSync('./_dist/component');
fs.copySync('./src/component', './_dist/component');

fs.writeJSONSync(`./_dist/component/standard/package.json`, {
   main: './index.js',
   module: './index.js',
   type: 'module'
});

compFiles = await getFileList({ dir: './_dist/component' });
for (const compFile of compFiles)
{
   let fileData = fs.readFileSync(compFile, 'utf-8').toString();
   fileData = fileData.replaceAll('#runtime/', '@typhonjs-fvtt/runtime/');
   fileData = fileData.replaceAll('@typhonjs-fvtt/svelte/', '@typhonjs-fvtt/runtime/svelte/');
   fileData = fileData.replaceAll('@typhonjs-svelte/lib/', '@typhonjs-fvtt/runtime/svelte/');
   fs.writeFileSync(compFile, fileData);
}

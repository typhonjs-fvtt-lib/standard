import resolve             from '@rollup/plugin-node-resolve';
import { generateDTS }     from '@typhonjs-build-test/esm-d-ts';
import { importsExternal } from '@typhonjs-build-test/rollup-plugin-pkg-imports';
import { getFileList }     from '@typhonjs-utils/file-util';
import fs                  from 'fs-extra';
import { rollup }          from 'rollup';

const sourcemap = true; // Defines whether source maps are generated.

const rollupConfigs = [
   {
      input: {
         input: 'src/application/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/application/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/fvtt/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/fvtt/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/plugin/system/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/plugin/system/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap,
      }
   },
   {
      input: {
         input: 'src/prosemirror/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/prosemirror/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/prosemirror/plugins/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/prosemirror/plugins/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/store/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/store/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   }
];

for (const config of rollupConfigs)
{
   console.log(`Generating bundle: ${config.input.input}`);

   const bundle = await rollup(config.input);
   await bundle.write(config.output);
   await bundle.close();
}

// Svelte standard components ----------------------------------------------------------------------------------------

// Handle component/standard by copying the source.
fs.emptyDirSync('./_dist/component');
fs.copySync('./src/component', './_dist/component');

const compFiles = await getFileList({ dir: './_dist/component', resolve: true, walk: true });

for (const compFile of compFiles)
{
   let fileData = fs.readFileSync(compFile, 'utf-8').toString();
   fileData = fileData.replaceAll('#runtime/', '@typhonjs-fvtt/runtime/');
   fileData = fileData.replaceAll('#standard/', '@typhonjs-fvtt/svelte-standard/');
   fileData = fileData.replaceAll('#svelte', 'svelte');
   fs.writeFileSync(compFile, fileData);
}

import resolve             from '@rollup/plugin-node-resolve';
import { generateDTS }     from '@typhonjs-build-test/esm-d-ts';
import { importsExternal } from '@typhonjs-build-test/rollup-external-imports';
import { getFileList }     from '@typhonjs-utils/file-util';
import fs                  from 'fs-extra';
import { rollup }          from 'rollup';

// Defines Rollup `external` option excluding Svelte.
const external = [/^svelte.*/];

// Defines whether source maps are generated / loaded from the .env file.
const sourcemap = true;

const rollupConfigs = [
   {
      input: {
         input: 'src/action/index.js',
         external,
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/action/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/index.js',
         external,
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
         external,
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
         input: 'src/plugin/data/index.js',
         external,
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/plugin/data/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap,
      }
   },
   {
      input: {
         input: 'src/plugin/system/index.js',
         external,
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
         external,
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
         input: 'src/store/index.js',
         external,
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
   const bundle = await rollup(config.input);
   await bundle.write(config.output);
   await bundle.close();
}

// // Handle application by copying the source.
// fs.emptyDirSync('./_dist/application');
// fs.copySync('./src/application', './_dist/application');
//
// let compFiles = await getFileList({ dir: './_dist/application' });
// for (const compFile of compFiles)
// {
//    let fileData = fs.readFileSync(compFile, 'utf-8').toString();
//    fileData = fileData.replaceAll('#runtime/', '@typhonjs-fvtt/runtime/');
//    fileData = fileData.replaceAll('@typhonjs-fvtt/svelte/', '@typhonjs-fvtt/runtime/svelte/');
//    fileData = fileData.replaceAll('@typhonjs-svelte/lib/', '@typhonjs-fvtt/runtime/svelte/');
//    fs.writeFileSync(compFile, fileData);
// }
//
// await generateDTS({
//    input: './_dist/application/index.js',
//    output: './_dist/application/index.d.ts'
// });

// Svelte standard components ----------------------------------------------------------------------------------------

// Handle component/standard by copying the source.
fs.emptyDirSync('./_dist/component');
fs.copySync('./src/component', './_dist/component');

const compFiles = await getFileList({ dir: './_dist/component' });
for (const compFile of compFiles)
{
   let fileData = fs.readFileSync(compFile, 'utf-8').toString();
   fileData = fileData.replaceAll('#runtime/', '@typhonjs-fvtt/runtime/');
   fileData = fileData.replaceAll('@typhonjs-fvtt/svelte/', '@typhonjs-fvtt/runtime/svelte/');
   fileData = fileData.replaceAll('@typhonjs-svelte/lib/', '@typhonjs-fvtt/runtime/svelte/');
   fs.writeFileSync(compFile, fileData);
}

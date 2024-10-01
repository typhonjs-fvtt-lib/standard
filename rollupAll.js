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
         input: 'src/application/dialog/document/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/application/dialog/document/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/filepicker/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/application/filepicker/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/menu/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin({ bundlePackageExports: true })
         ]
      },
      output: {
         file: '_dist/application/menu/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/sidebar/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin()
         ]
      },
      output: {
         file: '_dist/application/sidebar/index.js',
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
   fileData = fileData.replaceAll('#svelte', 'svelte');
   fs.writeFileSync(compFile, fileData);
}

await generateDTS({ input: '_dist/component/standard/button/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/color/picker/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/container/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/dom/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/folder/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/form/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/label/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/layer/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/media/index.js', bundlePackageExports: true })
await generateDTS({ input: '_dist/component/standard/menu/index.js', bundlePackageExports: true })

await generateDTS({ input: '_dist/component/fvtt/editor/index.js' })
await generateDTS({ input: '_dist/component/fvtt/filepicker/button/index.js' })
await generateDTS({ input: '_dist/component/fvtt/settings/index.js' })

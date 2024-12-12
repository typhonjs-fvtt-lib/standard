import resolve             from '@rollup/plugin-node-resolve';
import { generateDTS }     from '@typhonjs-build-test/esm-d-ts';
import { importsExternal } from '@typhonjs-build-test/rollup-plugin-pkg-imports';
import { getFileList }     from '@typhonjs-utils/file-util';
import fs                  from 'fs-extra';
import { rollup }          from 'rollup';

const sourcemap = true; // Defines whether source maps are generated.

// Bundle all top level external package exports.
const dtsPluginOptions = {
   bundlePackageExports: true,
   dtsReplace: { '/\\/\\/ <reference.*\\/>': '' }, // Svelte v4 types currently add triple slash references.
   importsExternal: true                           // For the direct component sub-path invocations.
};

const rollupConfigs = [
   {
      input: {
         input: 'src/action/animate/composable/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/action/animate/composable/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },

   {
      input: {
         input: 'src/application/control/filepicker/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/application/control/filepicker/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/control/sidebar/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/application/control/sidebar/index.js',
         format: 'es',
         generatedCode: { constBindings: true },
         sourcemap
      }
   },
   {
      input: {
         input: 'src/application/dialog/document/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
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
         input: 'src/application/menu/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
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
         input: 'src/fvtt/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
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
         input: 'src/store/fvtt/settings/index.js',
         plugins: [
            importsExternal(),
            resolve(),
            generateDTS.plugin(dtsPluginOptions)
         ]
      },
      output: {
         file: '_dist/store/fvtt/settings/index.js',
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

// Svelte standard components ----------------------------------------------------------------------------------------

// Handle component/standard by copying the source.
fs.emptyDirSync('./_dist/component');
fs.copySync('./src/component', './_dist/component');

// Copy all `standard-base` components to local path `./_dist/component/standard`.
fs.copySync('./node_modules/@typhonjs-svelte/standard-base/_dist/component', './_dist/component/standard');

const compFiles = await getFileList({ dir: './_dist/component', resolve: true, walk: true });

// Replace all `#imports` references.
for (const compFile of compFiles)
{
   let fileData = fs.readFileSync(compFile, 'utf-8').toString();

   // Ignore any `{@link #runtime...}` enclosed references.
   fileData = fileData.replaceAll(/(?<!\{@link\s*)#runtime\//g, '@typhonjs-fvtt/runtime/');

   // Ignore any `{@link #standard...}` enclosed references.
   fileData = fileData.replaceAll(/(?<!\{@link\s*)#standard\//g, '@typhonjs-fvtt/standard/');

   fileData = fileData.replaceAll('#svelte', 'svelte');

   fs.writeFileSync(compFile, fileData);
}

// Add required Foundry / CSS variable import to all index files from `standard-base` that export components.
const indexFiles = await getFileList({ dir: './_dist/component/standard', resolve: true, walk: true, includeFile: /index\.js$/ });
for (const indexFile of indexFiles)
{
   const fileData = fs.readFileSync(indexFile, 'utf-8').toString();

   // Exclude index files that don't export Svelte components.
   if (!fileData.includes('export { default as')) { continue; }

   fs.writeFileSync(indexFile, `import '#internal/configure';\n\n${fileData}`);
}

await generateDTS({ input: '_dist/component/fvtt-internal/index.js', ...dtsPluginOptions });

await generateDTS({ input: '_dist/component/fvtt/editor/index.js', ...dtsPluginOptions });
await generateDTS({ input: '_dist/component/fvtt/filepicker/button/index.js', ...dtsPluginOptions });
await generateDTS({ input: '_dist/component/fvtt/settings/index.js', ...dtsPluginOptions });

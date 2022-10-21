export function generatePlugin(externalPaths, exclude = [], output = false)
{
   const plugin = {
      name: 'typhonjs-fvtt-runtime-lib'
   };

   if (output)
   {
      // TODO: THIS IS A TEST BELOW of setting output options.
      plugin.outputOptions = (opts) =>
      {
         if (Array.isArray(opts))
         {
            for (const outputOpts of opts)
            {
               outputOpts.paths = typeof outputOpts.paths === 'object' ? { ...outputOpts.paths, ...externalPaths } :
                externalPaths;
            }
         }
         else if (typeof opts === 'object')
         {
            opts.paths = typeof opts.paths === 'object' ? { ...opts.paths, ...externalPaths } : externalPaths;
         }
      };
   }
   else
   {
      plugin.options = (opts) =>
      {
         // Used in local plugin to filter external opts.
         const externalOpts = Object.keys(externalPaths).filter((entry) => !exclude.includes(entry))

         opts.external = Array.isArray(opts.external) ? [...externalOpts, ...opts.external] : externalOpts;

         if (Array.isArray(opts.output))
         {
            for (const outputOpts of opts.output)
            {
               outputOpts.paths = typeof outputOpts.paths === 'object' ? { ...outputOpts.paths, ...externalPaths } :
                externalPaths;
            }
         }
         else if (typeof opts.output === 'object')
         {
            opts.output.paths = typeof opts.output.paths === 'object' ? { ...opts.output.paths, ...externalPaths } :
             externalPaths;
         }
      };
   }

   return plugin;
}

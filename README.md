# @typhonjs-fvtt/standard
Provides a standard Svelte component library for the TyphonJS Runtime Library (Foundry VTT version).

More information coming soon. Please refer to demo projects on setup / usage details.

## Installation:
In your `package.json` `imports` and `dependencies` include:
```json
{
  "imports": {
    "#runtime/*": "@typhonjs-fvtt/runtime/*",
    "#standard/*": "@typhonjs-fvtt/standard/*"
  },
  "dependencies": {
    "@typhonjs-fvtt/runtime": "^0.2.0",
    "@typhonjs-fvtt/standard": "^0.2.0",
    "svelte": "^4.0.0"
  }
}
```

You may use the highest released Svelte version greater than `4.0.0`. It is recommended that you view the demo examples
for the rest of the standard configuration details which use Vite for building your package.

## API Documentation:
The initial beta release of TRL now has unified API documentation for all ESM packages
[available here](https://typhonjs-fvtt-lib.github.io/api-docs/). Work is still ongoing to provide type declarations and
documentation for all of the Svelte components available in TRL.

## ES Module Demo Module:
- [essential-svelte-esm](https://github.com/typhonjs-fvtt-demo/essential-svelte-esm) for a demo repo
  w/ several basic TRL / Foundry examples utilizing the TRL.

- [template-svelte-esm](https://github.com/typhonjs-fvtt-demo/template-svelte-esm) for a starter bare bones template
  repo to duplicate for your own module.

- [typhonjs-fvtt-demo organization](https://github.com/typhonjs-fvtt-demo/) for
  all demo repos.

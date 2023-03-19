let isV10 = false;

Hooks.once('init', () =>
{
   isV10 = !globalThis.foundry.utils.isNewerVersion(10, globalThis.game.version ?? globalThis.game?.data?.version);
});

export class FVTTVersion
{
   /**
    * Returns true when Foundry is v10+
    *
    * @returns {boolean} Foundry v10+
    */
   static get isV10() { return isV10; }
}

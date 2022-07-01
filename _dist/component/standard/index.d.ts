import { SvelteComponent } from 'svelte/types/runtime/internal/Component';

type StackingContext = {
    /**
     * A DOM Element
     */
    node: Element;
    /**
     * Reason for why a stacking context was created
     */
    reason: string;
};
type ControlsData = {
    /**
     * -
     */
    boundingRect: DOMRect;
    /**
     * -
     */
    enabled: boolean;
    /**
     * -
     */
    validate: boolean;
};
declare class TJSContextMenu extends SvelteComponent {
    constructor(options: any);
}
declare class TJSIconButton extends SvelteComponent {
    constructor(options: any);
}
declare class TJSIconFolder extends SvelteComponent {
    constructor(options: any);
}
declare class TJSInput extends SvelteComponent {
    constructor(options: any);
}
declare class TJSMenu extends SvelteComponent {
    constructor(options: any);
}
declare class TJSPositionControlLayer extends SvelteComponent {
    constructor(options: any);
}
declare class TJSSelect extends SvelteComponent {
    constructor(options: any);
}
declare class TJSSvgFolder extends SvelteComponent {
    constructor(options: any);
}
declare class TJSToggleIconButton extends SvelteComponent {
    constructor(options: any);
}

export { ControlsData, StackingContext, TJSContextMenu, TJSIconButton, TJSIconFolder, TJSInput, TJSMenu, TJSPositionControlLayer, TJSSelect, TJSSvgFolder, TJSToggleIconButton };

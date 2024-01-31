import { default as FocusWrap }        from './FocusWrap.svelte';
import { default as PickerIndicator }  from './PickerIndicator.svelte';
import { default as PickerWrapper }    from './PickerWrapper.svelte';
import { default as SliderIndicator }  from './SliderIndicator.svelte';
import { default as SliderWrapper }    from './SliderWrapper.svelte';
import { default as Wrapper }          from './Wrapper.svelte';

/**
 * The default layout components.
 *
 * @type {import('../../../').TJSColordPickerComponents}
 */
export const components = {
   alphaIndicator: SliderIndicator,
   alphaWrapper: SliderWrapper,
   focusWrap: FocusWrap,
   pickerIndicator: PickerIndicator,
   pickerWrapper: PickerWrapper,
   sliderIndicator: SliderIndicator,
   sliderWrapper: SliderWrapper,
   wrapper: Wrapper
};

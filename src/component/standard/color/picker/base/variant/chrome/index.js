import { default as ChromePickerIndicator }  from './PickerIndicator.svelte';
import { default as ChromePickerWrapper }    from './PickerWrapper.svelte';
import { default as ChromeSliderIndicator }  from './SliderIndicator.svelte';
import { default as ChromeSliderWrapper }    from './SliderWrapper.svelte';
import { default as ChromeWrapper }          from './Wrapper.svelte';

export const components = {
   sliderIndicator: ChromeSliderIndicator,
   pickerIndicator: ChromePickerIndicator,
   alphaIndicator: ChromeSliderIndicator,
   pickerWrapper: ChromePickerWrapper,
   sliderWrapper: ChromeSliderWrapper,
   alphaWrapper: ChromeSliderWrapper,
   wrapper: ChromeWrapper
};

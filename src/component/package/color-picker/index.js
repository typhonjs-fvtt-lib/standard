export { default as TJSColorPicker } from './components/TJSColorPicker.svelte';

// TODO REMOVE TYPE
// export type { HsvaColor, RgbaColor } from 'colord';

import { default as ChromePickerIndicator }  from './components/variant/chrome-picker/PickerIndicator.svelte';
import { default as ChromePickerWrapper }    from './components/variant/chrome-picker/PickerWrapper.svelte';
import { default as ChromeSliderIndicator }  from './components/variant/chrome-picker/SliderIndicator.svelte';
import { default as ChromeSliderWrapper }    from './components/variant/chrome-picker/SliderWrapper.svelte';
import { default as ChromeWrapper }          from './components/variant/chrome-picker/Wrapper.svelte';

export { default as A11yHorizontalWrapper }  from './components/variant/A11yHorizontalWrapper.svelte';

export const ChromeVariant = {
   sliderIndicator: ChromeSliderIndicator,
   pickerIndicator: ChromePickerIndicator,
   alphaIndicator: ChromeSliderIndicator,
   pickerWrapper: ChromePickerWrapper,
   sliderWrapper: ChromeSliderWrapper,
   alphaWrapper: ChromeSliderWrapper,
   wrapper: ChromeWrapper
};

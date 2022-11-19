import TextInput  from './TextInput.svelte';

import HexInput   from './HexInput.svelte';
import HslInput   from './HslInput.svelte';
import HsvInput   from './HsvInput.svelte';
import RgbInput   from './RgbInput.svelte';

export const textInputModes = {
   hex: {
      channels: ['HEX'],
      name: 'HEX',
      class: HexInput
   },
   hsl: {
      channels: ['H', 'S', 'L'],
      name: 'HSL',
      class: HslInput
   },
   hsv: {
      channels: ['H', 'S', 'V'],
      name: 'HSV',
      class: HsvInput
   },
   rgb: {
      channels: ['R', 'G', 'B'],
      name: 'RGB',
      class: RgbInput
   }
};

/**
 * The text input component.
 *
 * @type {PickerComponents}
 */
export const textInput = {
   textInput: TextInput
};

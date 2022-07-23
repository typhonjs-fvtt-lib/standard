const boxLength = 5;

const size = `${boxLength}px`;
const minusSize = `-${boxLength}px`;

export const hitboxData = [
   // corners (top, right, bottom right, bottom left)
   { id: 0, styles: { top: minusSize, left: minusSize, width: size, height: size, cursor: 'nwse-resize' } },
   { id: 1, styles: { top: minusSize, left: '100%', width: size, height: size, cursor: 'nesw-resize' } },
   { id: 2, styles: { top: '100%', left: '100%', width: size, height: size, cursor: 'nwse-resize' } },
   { id: 3, styles: { top: '100%', left: minusSize, width: size, height: size, cursor: 'nesw-resize' } },

   // sides (top, right, bottom, left)
   { id: 4, styles: { top: minusSize, left: 0, width: '100%', height: size, cursor: 'ns-resize' } },
   { id: 5, styles: { top: 0, left: '100%', width: size, height: '100%', cursor: 'ew-resize' } },
   { id: 6, styles: { top: '100%', left: 0, width: '100%', height: size, cursor: 'ns-resize' } },
   { id: 7, styles: { top: 0, left: minusSize, width: size, height: '100%', cursor: 'ew-resize' } }
];

export const hitboxCallback = [{}, {}, {}, {}, {}, {}, {}, {}];

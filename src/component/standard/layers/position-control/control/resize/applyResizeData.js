import { hitboxCallback } from './constants.js';

export function applyResizeData(id, dX, dY, control)
{
   const data = hitboxCallback[id];

   switch (id)
   {
      case 0:
      {
         const heightAdjust = control.position.height - dY;

         if (heightAdjust < 0) { dY += heightAdjust; }

         data.top = `+=${dY}`;
         data.height = `+=${-dY}`;

         const widthAdjust = control.position.width - dX;

         if (widthAdjust < 0) { dX += widthAdjust; }

         data.left = `+=${dX}`;
         data.width = `+=${-dX}`;
         break;
      }

      case 1:
      {
         const heightAdjust = control.position.height - dY;

         if (heightAdjust < 0) { dY += heightAdjust; }

         data.top = `+=${dY}`;
         data.height = `+=${-dY}`;
         data.width = `+=${dX}`;
         break;
      }

      case 2:
      {
         data.width = `+=${dX}`;
         data.height = `+=${dY}`;
         break;
      }

      case 3:
      {
         const widthAdjust = control.position.width - dX;

         if (widthAdjust < 0) { dX += widthAdjust; }

         data.left = `+=${dX}`;
         data.width = `+=${-dX}`;
         data.height = `+=${dY}`;
         break;
      }

      case 4:
      {
         const heightAdjust = control.position.height - dY;

         if (heightAdjust < 0) { dY += heightAdjust; }

         data.top = `+=${dY}`;
         data.height = `+=${-dY}`;
         break;
      }

      case 5:
      {
         data.width = `+=${dX}`;
         break;
      }

      case 6:
      {
         data.height = `+=${dY}`;
         break;
      }

      case 7:
      {
         const widthAdjust = control.position.width - dX;

         if (widthAdjust < 0) { dX += widthAdjust; }

         data.left = `+=${dX}`;
         data.width = `+=${-dX}`;
         break;
      }
   }

   return data;
}
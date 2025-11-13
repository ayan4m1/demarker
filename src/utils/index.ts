export const webGpuAvailable = 'gpu' in navigator;

export const getPageTitle = (title: string): string => `Demarker - ${title}`;

export const bufferToImageString = (
  buffer: Uint8Array<ArrayBuffer>,
  mimeType: string
) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
};

export const imageStringToBuffer = (imageString: string) => {
  const bytes = atob(imageString.substring(imageString.lastIndexOf(',') + 1));
  const result = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes.charCodeAt(i);
  }

  return result;
};

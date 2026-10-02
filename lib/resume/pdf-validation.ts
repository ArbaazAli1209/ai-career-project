const pdfHeaderWindow = 1024;

export function hasPdfHeader(contents: Uint8Array) {
  const header = new TextDecoder().decode(contents.subarray(0, pdfHeaderWindow));
  return /%PDF-\d\.\d/.test(header);
}
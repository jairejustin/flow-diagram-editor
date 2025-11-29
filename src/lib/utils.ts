export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine === '' ? word : currentLine + ' ' + word;
    // Estimate text width, this is a simplified approach and might need adjustment
    // A more accurate approach would involve measuring text in an SVG element or canvas
    const testWidth = testLine.length * (fontSize * 0.6); // Roughly estimate width based on average character width

    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}
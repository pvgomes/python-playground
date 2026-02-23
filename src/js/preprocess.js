export function preprocessCode(code) {
  // Convert C/JS-style line comments (//) to Python comments (#)
  // Only when // appears at the start of a line (with optional whitespace).
  return code.replace(/^(\s*)\/\/(.*)$/gm, '$1#$2');
}

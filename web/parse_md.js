export function parseMd(text) {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n\s*\*\s+(.*)/g, '<br>• $1');
  html = html.replace(/\n/g, '<br>');
  return html;
}

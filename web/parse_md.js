/** Escape HTML entities to prevent XSS */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function parseMd(text) {
  let html = esc(text);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n\s*\*\s+(.*)/g, '<br>• $1');
  html = html.replace(/\n/g, '<br>');
  return html;
}

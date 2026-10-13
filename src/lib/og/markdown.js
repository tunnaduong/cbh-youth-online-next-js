/**
 * Turns a post's markdown into a few short blocks for the preview in the
 * share card. Not a full parser: it keeps the shape of the text (headings,
 * lists, quotes, code) and drops inline syntax, images, tables and html.
 */

function stripInline(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!>|~])/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @returns {{type: "h"|"p"|"li"|"quote"|"code", text: string}[]}
 */
export function markdownToBlocks(markdown, { maxBlocks = 8, maxChars = 650 } = {}) {
  const blocks = [];
  let used = 0;
  let inCode = false;
  let codeLines = [];

  const push = (type, raw, limit = 220) => {
    // code keeps its line breaks and symbols
    const text = type === "code" ? raw.trim() : stripInline(raw);
    if (!text) return;
    const clipped = text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
    blocks.push({ type, text: clipped });
    used += clipped.length;
  };

  for (const line of String(markdown || "").replace(/\r/g, "").split("\n")) {
    if (blocks.length >= maxBlocks || used >= maxChars) break;

    if (/^\s*(```|~~~)/.test(line)) {
      if (inCode) {
        push("code", codeLines.slice(0, 4).join("\n"), 200);
        codeLines = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      codeLines.push(line.replace(/\t/g, "  ").slice(0, 70));
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^([-*_])\1{2,}$/.test(trimmed)) continue; // horizontal rule
    if (trimmed.startsWith("|")) continue; // table row
    if (/^!\[[^\]]*\]\([^)]*\)$/.test(trimmed)) continue; // image only

    let m;
    if ((m = trimmed.match(/^#{1,6}\s+(.*)$/))) push("h", m[1], 90);
    else if ((m = trimmed.match(/^>\s?(.*)$/))) push("quote", m[1]);
    else if ((m = trimmed.match(/^(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?(.*)$/)))
      push("li", m[1], 120);
    else push("p", trimmed, 320);
  }

  if (inCode && codeLines.length && blocks.length < maxBlocks) {
    push("code", codeLines.slice(0, 4).join("\n"), 200);
  }
  return blocks;
}

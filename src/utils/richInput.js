/**
 * Shared utilities for contenteditable mention-aware inputs.
 * Used by ChatMessageInput, MessageInput, CommentInput.
 */

const MENTION_RE = /(@[\w.\-À-ɏ]+)/gu;

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildLineHtml(line, allowAllMention) {
  return line
    .split(MENTION_RE)
    .map((part, i) => {
      if (i % 2 !== 1) return esc(part);
      if (!allowAllMention && part.slice(1).toLowerCase() === "all") return esc(part);
      return `<span class="ce-mention">${esc(part)}</span>`;
    })
    .join("");
}

// Newlines (from Shift+Enter) need to become <br> - a bare "\n" inside a
// contenteditable's HTML is collapsed/ignored by the browser.
export function buildHtml(text, allowAllMention = true) {
  if (!text) return "";
  return text
    .split("\n")
    .map((line) => buildLineHtml(line, allowAllMention))
    .join("<br>");
}

export function getCaretOffset(el) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return 0;
  const pre = sel.getRangeAt(0).cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return pre.toString().length;
}

// Same as getCaretOffset but for the *start* of the current selection - the
// two differ when text is actually selected (not just a collapsed caret).
export function getSelectionStartOffset(el) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return 0;
  const pre = sel.getRangeAt(0).cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
  return pre.toString().length;
}

export function setCaretOffset(el, offset) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let rem = offset;
  let node;
  while ((node = tw.nextNode())) {
    if (rem <= node.textContent.length) {
      const r = document.createRange();
      r.setStart(node, rem);
      r.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    rem -= node.textContent.length;
  }
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
}

// el.textContent silently drops <br> elements (they contribute zero
// characters), which is how Shift+Enter line breaks get lost. Walk the DOM
// instead and turn <br> - and the extra <div>/<p> blocks some browsers
// create on plain Enter before handleKeyDown's preventDefault kicks in -
// back into "\n".
export function getContentText(el) {
  let out = "";
  const BLOCK_TAGS = new Set(["DIV", "P"]);

  function walk(node, isFirstBlockChild) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === "BR") {
      out += "\n";
      return;
    }
    if (BLOCK_TAGS.has(node.tagName) && !isFirstBlockChild) {
      out += "\n";
    }
    let first = true;
    for (const child of node.childNodes) {
      walk(child, first);
      first = false;
    }
  }

  let first = true;
  for (const child of el.childNodes) {
    walk(child, first);
    first = false;
  }

  if (out.endsWith("\n")) out = out.slice(0, -1);
  return out;
}

/**
 * Creates a proxy ref object compatible with useMentionInput and MarkdownToolbar.
 * Pass a getter for divRef so the proxy always references the current DOM element.
 */
export function makeProxyRef(getDivEl, onValueSet, allowAllMention = true) {
  return {
    get selectionStart() {
      const el = getDivEl();
      return el ? getSelectionStartOffset(el) : 0;
    },
    get selectionEnd() {
      const el = getDivEl();
      return el ? getCaretOffset(el) : 0;
    },
    get value() {
      const el = getDivEl();
      return el ? getContentText(el) : "";
    },
    set value(newText) {
      const el = getDivEl();
      if (el) {
        el.innerHTML = buildHtml(newText, allowAllMention);
        onValueSet?.(newText);
      }
    },
    focus() {
      getDivEl()?.focus();
    },
    setSelectionRange(pos) {
      const el = getDivEl();
      if (el) {
        el.focus();
        setCaretOffset(el, pos);
      }
    },
  };
}

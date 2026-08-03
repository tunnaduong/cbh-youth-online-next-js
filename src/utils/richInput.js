/**
 * Shared utilities for contenteditable mention-aware inputs.
 * Used by ChatMessageInput, MessageInput, CommentInput.
 */

const MENTION_RE = /(@[\w\-À-ɏ]+)/gu;

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildHtml(text, allowAllMention = true) {
  if (!text) return "";
  return text
    .split(MENTION_RE)
    .map((part, i) => {
      if (i % 2 !== 1) return esc(part);
      if (!allowAllMention && part.slice(1).toLowerCase() === "all") return esc(part);
      return `<span class="ce-mention">${esc(part)}</span>`;
    })
    .join("");
}

export function getCaretOffset(el) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return 0;
  const pre = sel.getRangeAt(0).cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
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

export function getContentText(el) {
  let t = el.textContent ?? "";
  if (t.endsWith("\n")) t = t.slice(0, -1);
  return t;
}

/**
 * Creates a proxy ref object compatible with useMentionInput and MarkdownToolbar.
 * Pass a getter for divRef so the proxy always references the current DOM element.
 */
export function makeProxyRef(getDivEl, onValueSet, allowAllMention = true) {
  return {
    get selectionStart() {
      const el = getDivEl();
      return el ? getCaretOffset(el) : 0;
    },
    get selectionEnd() {
      return this.selectionStart;
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

/**
 * Shared utilities for contenteditable mention-aware inputs.
 * Used by ChatMessageInput, MessageInput, CommentInput, CreatePostModal.
 *
 * Highlighting (mentions, /ai /summary /help) is done with the CSS Custom
 * Highlight API (CSS.highlights / window.Highlight) instead of wrapping
 * matched text in <span> elements inside the contenteditable. Two previous
 * attempts at the span approach (including a zero-width-space "escape
 * hatch" trick) still broke typing with Linux input methods that don't use
 * the standard composition-event protocol - notably ibus-unikey/fcitx5-Lotus
 * in their "X11 uinput" modes, which insert a Vietnamese tone mark via a
 * synthesized raw backspace+retype outside any composition event, racing
 * with the innerHTML rebuilds that adding/removing spans requires. The
 * Custom Highlight API colors arbitrary text Ranges purely at the paint
 * layer - it never touches the DOM tree - so nothing about it can ever
 * interfere with any IME, uinput-based or otherwise: the contenteditable
 * itself is left as plain, boring text the whole time.
 */

const MENTION_RE = /@[\w.\-À-ɏ]+/gu;
// Only counts as the Chat with AI trigger when it's the very first thing in
// the message (matches the backend's leading-prefix check).
const AI_COMMAND_RE = /^\/(ai|summary|help)\b/i;

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Collapse CRLF / lone CR line endings to plain "\n". Text coming back from
// the API can carry Windows line endings (posts written in an editor that
// submits CRLF, content pasted in from Word, ...), and buildHtml() used to
// escape the "\r" straight into the HTML it produced. The HTML parser turns
// that lone "\r" into a "\n" *inside the text node*, which `white-space:
// pre-wrap` renders as a second line break right next to the <br> we already
// emitted - and getContentText() then reads both back. So every paragraph
// break in an existing post doubled the moment the post was opened for
// editing, and the doubling got saved back on submit. Normalizing at both
// ends of the round-trip keeps "\r\n" and "\n" rendering identically.
export function normalizeNewlines(text) {
  if (!text) return "";
  return String(text).replace(/\r\n?/g, "\n");
}

// Newlines (from Shift+Enter) need to become <br> - a bare "\n" inside a
// contenteditable's HTML is collapsed/ignored by the browser. No spans, no
// styling here at all - see the module docblock for why.
export function buildHtml(text) {
  if (!text) return "";
  return normalizeNewlines(text).split("\n").map(esc).join("<br>");
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

  // A text node can still hold a raw "\r"/"\r\n" (pasted content, or HTML
  // set from outside buildHtml) - normalize before the trailing-newline trim
  // so a trailing "\r\n" doesn't leave a stray "\r" behind.
  out = normalizeNewlines(out);
  if (out.endsWith("\n")) out = out.slice(0, -1);
  return out;
}

// Character ranges (within the plain getContentText() string) that should
// be colored, split by highlight "kind" (mention vs ai-command) so the
// caller can register them under separate CSS.highlights names.
function computeHighlightRanges(text, allowAllMention, enableAiCommands) {
  const mentionRanges = [];
  const commandRanges = [];

  if (enableAiCommands) {
    const match = text.match(AI_COMMAND_RE);
    if (match) {
      commandRanges.push([0, match[0].length]);
    }
  }

  let m;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(text)) !== null) {
    if (!allowAllMention && m[0].toLowerCase() === "@all") continue;
    mentionRanges.push([m.index, m.index + m[0].length]);
  }

  return { mentionRanges, commandRanges };
}

const HIGHLIGHT_SUPPORTED =
  typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";

// Finds the (node, offsetWithinNode) pair for a plain-text character index
// inside el, by walking its text nodes cumulatively - the Range-based
// equivalent of setCaretOffset, but returning a position instead of
// selecting it.
function locate(el, charIndex) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let rem = charIndex;
  let node;
  let last = null;
  while ((node = tw.nextNode())) {
    last = node;
    if (rem <= node.textContent.length) {
      return { node, offset: rem };
    }
    rem -= node.textContent.length;
  }
  return last ? { node: last, offset: last.textContent.length } : null;
}

/**
 * Colors mentions/@all and a leading /ai /summary /help command inside a
 * contenteditable div, using CSS.highlights instead of touching the DOM -
 * see the module docblock. No-ops (silently) on browsers without the
 * Custom Highlight API (older Firefox, Safari < 17.2): those browsers just
 * don't get live coloring while typing, which is a harmless visual
 * degradation - the sent message still renders colored correctly either
 * way, since that's done by unrelated, already-safe render code.
 */
export function applyHighlights(el, text, allowAllMention = true, enableAiCommands = false) {
  if (!HIGHLIGHT_SUPPORTED || !el) return;

  const { mentionRanges, commandRanges } = computeHighlightRanges(text, allowAllMention, enableAiCommands);

  const toRanges = (pairs) =>
    pairs
      .map(([start, end]) => {
        const from = locate(el, start);
        const to = locate(el, end);
        if (!from || !to) return null;
        const r = new Range();
        r.setStart(from.node, from.offset);
        r.setEnd(to.node, to.offset);
        return r;
      })
      .filter(Boolean);

  const mentionRs = toRanges(mentionRanges);
  const commandRs = toRanges(commandRanges);

  if (mentionRs.length) {
    CSS.highlights.set("ce-mention", new Highlight(...mentionRs));
  } else {
    CSS.highlights.delete("ce-mention");
  }

  if (commandRs.length) {
    CSS.highlights.set("ce-ai-command", new Highlight(...commandRs));
  } else {
    CSS.highlights.delete("ce-ai-command");
  }
}

/**
 * Creates a proxy ref object compatible with useMentionInput and MarkdownToolbar.
 * Pass a getter for divRef so the proxy always references the current DOM element.
 */
export function makeProxyRef(getDivEl, onValueSet, allowAllMention = true, enableAiCommands = false) {
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
        el.innerHTML = buildHtml(newText);
        applyHighlights(el, newText, allowAllMention, enableAiCommands);
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

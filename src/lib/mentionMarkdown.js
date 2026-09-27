/**
 * markdown-it inline rule that recognizes the same `@username` syntax the
 * old contentEditable composer stored as plain text (see MENTION_RE in
 * src/utils/richInput.js) and turns it into the HTML the Tiptap Mention
 * node's `parseHTML` expects (`span[data-type="mention"]`), so existing
 * posts round-trip through the new Tiptap editor without any data
 * migration. Registered via the Mention extension's
 * `storage.markdown.parse.setup` hook (see MentionExtension.js).
 */
const MENTION_RE = /^@([\w.\-À-ɏ]+)/u;

function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function mentionMarkdownItPlugin(md) {
  md.inline.ruler.push("mention", (state, silent) => {
    // Same boundary rule as the mention/hashtag regex used elsewhere
    // (richInput.js, MarkdownRenderer.js): don't trigger mid-word, so
    // "test@example.com" isn't mistaken for a mention.
    const prevChar = state.src[state.pos - 1];
    if (prevChar && /[\w\]]/u.test(prevChar)) return false;

    const match = MENTION_RE.exec(state.src.slice(state.pos));
    if (!match) return false;

    if (!silent) {
      const token = state.push("mention", "", 0);
      token.meta = { username: match[1] };
    }
    state.pos += match[0].length;
    return true;
  });

  md.renderer.rules.mention = (tokens, idx) => {
    const { username } = tokens[idx].meta;
    const esc = escapeAttr(username);
    return `<span data-type="mention" data-id="${esc}" data-label="${esc}">@${esc}</span>`;
  };
}

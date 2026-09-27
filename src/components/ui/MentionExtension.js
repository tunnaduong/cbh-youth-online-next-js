"use client";

import Mention from "@tiptap/extension-mention";
import { getMentionSuggestions } from "@/app/Api";
import mentionMarkdownItPlugin from "@/lib/mentionMarkdown";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function avatarUrl(user) {
  return (
    user.avatar_url ||
    `${process.env.NEXT_PUBLIC_API_URL}/v1.0/users/${user.username}/avatar`
  );
}

// `@tiptap/extension-mention` ships its own markdown shortcode spec
// (`[mention id="..."]`) via `createInlineMarkdownSpec`, but that's part of
// a different (newer, not-yet-wired-up) markdown pipeline than the
// `tiptap-markdown` package this app uses - `tiptap-markdown` only ever
// looks at `extension.storage.markdown` (see getMarkdownSpec() in its
// source), so the shortcode spec is silently ignored. We override
// `addStorage` here to serialize/parse plain `@username` text instead,
// matching exactly what the old contentEditable composer stored and what
// the backend/MarkdownRenderer already know how to render.
const PostMention = Mention.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write(`@${node.attrs.label || node.attrs.id}`);
        },
        parse: {
          setup(markdownit) {
            markdownit.use(mentionMarkdownItPlugin);
          },
        },
      },
    };
  },
});

/**
 * Vanilla-DOM suggestion popup (no React root needed) - lists the same
 * user cards MentionSuggestionsDropdown.js renders for other @mention
 * inputs in the app, positioned via Tiptap's built-in floating-ui `mount`.
 */
function renderMentionSuggestion() {
  let popupEl = null;
  let unmount = null;
  let selectedIndex = 0;
  let latestProps = null;

  const paint = (props) => {
    latestProps = props;
    if (!popupEl) return;
    popupEl.innerHTML = "";

    if (!props.items.length) {
      popupEl.style.display = "none";
      return;
    }
    popupEl.style.display = "block";

    props.items.forEach((user, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors " +
        (index === selectedIndex
          ? "bg-gray-50 dark:bg-neutral-700"
          : "hover:bg-gray-50 dark:hover:bg-neutral-700");
      btn.innerHTML = `
        <img src="${escapeHtml(avatarUrl(user))}" alt="" class="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">${escapeHtml(user.profile_name || user.username)}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">@${escapeHtml(user.username)}</p>
        </div>`;
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        props.command(user);
      });
      popupEl.appendChild(btn);
    });
  };

  return {
    onStart: (props) => {
      selectedIndex = 0;
      popupEl = document.createElement("div");
      popupEl.className =
        "max-h-80 min-w-[240px] overflow-y-auto bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-xl";
      paint(props);
      unmount = props.mount(popupEl);
    },
    onUpdate: (props) => {
      selectedIndex = 0;
      paint(props);
    },
    onKeyDown: ({ event }) => {
      if (!latestProps?.items?.length) return false;
      if (event.key === "ArrowDown") {
        selectedIndex = (selectedIndex + 1) % latestProps.items.length;
        paint(latestProps);
        return true;
      }
      if (event.key === "ArrowUp") {
        selectedIndex =
          (selectedIndex - 1 + latestProps.items.length) % latestProps.items.length;
        paint(latestProps);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        latestProps.command(latestProps.items[selectedIndex]);
        return true;
      }
      if (event.key === "Escape") {
        unmount?.();
        return true;
      }
      return false;
    },
    onExit: () => {
      unmount?.();
      popupEl = null;
      latestProps = null;
    },
  };
}

export function createMentionExtension() {
  return PostMention.configure({
    HTMLAttributes: { class: "mention" },
    suggestion: {
      char: "@",
      debounce: 200,
      items: async ({ query }) => {
        try {
          const res = await getMentionSuggestions(query);
          const results = res?.data?.suggestions || [];
          // Posts don't support "@all" broadcast mentions - see the same
          // note in the old usePostComposer.js this replaces.
          return results.filter((u) => u.username?.toLowerCase() !== "all");
        } catch {
          return [];
        }
      },
      command: ({ editor, range, props: user }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, [
            { type: "mention", attrs: { id: String(user.id), label: user.username } },
            { type: "text", text: " " },
          ])
          .run();
      },
      render: renderMentionSuggestion,
    },
  });
}

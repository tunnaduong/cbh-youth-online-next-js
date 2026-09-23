"use client";

import { useState } from "react";
import { EditorContent } from "@tiptap/react";
import { useRichTextEditor } from "@/components/ui/RichTextEditor";

export default function Page() {
  const [md, setMd] = useState("Dòng một.\r\n\r\nDòng hai.\r\n\r\n![](https://example.com/a.png)\r\n");
  const editor = useRichTextEditor({ value: md, onChange: setMd, placeholder: "x" });
  return (
    <div>
      <EditorContent editor={editor} id="ed" />
      <pre id="md">{JSON.stringify(md)}</pre>
      <button
        id="ins"
        onClick={() => {
          const pos = editor.state.selection.from;
          editor.chain().focus().insertContentAt(pos, [{ type: "image", attrs: { src: "https://example.com/b.png" } }]).run();
        }}
      >
        insert
      </button>
    </div>
  );
}

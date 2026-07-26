import { generateSlug } from "@/utils/slugify";

/**
 * Parse an HTML string, assign unique ids to h1/h2/h3 headings, and
 * return both the updated HTML and a flat list describing each heading.
 * @param {string} html
 * @returns {{ html: string, headings: Array<{id: string, text: string, level: number}> }}
 */
export function extractHeadingsAndInjectIds(html) {
  if (!html || typeof window === "undefined") {
    return { html, headings: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headingEls = doc.body.querySelectorAll("h1, h2, h3");

  if (headingEls.length === 0) {
    return { html, headings: [] };
  }

  const usedIds = new Set();
  const headings = [];

  headingEls.forEach((el) => {
    const text = el.textContent.trim();
    if (!text) return;

    const baseId = generateSlug(text);
    let uniqueId = baseId;
    let counter = 2;
    while (usedIds.has(uniqueId)) {
      uniqueId = `${baseId}-${counter}`;
      counter += 1;
    }
    usedIds.add(uniqueId);

    el.id = uniqueId;
    headings.push({
      id: uniqueId,
      text,
      level: parseInt(el.tagName.substring(1), 10),
    });
  });

  return { html: doc.body.innerHTML, headings };
}

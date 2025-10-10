"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

const MarkdownRenderer = ({ content, className = "" }) => {
  if (!content || content.trim() === "") {
    return (
      <div className="text-gray-400 text-center py-8">
        Không có nội dung để xem trước
      </div>
    );
  }

  // Process content to handle iframes with whitelist (like backend)
  const processContent = (markdown) => {
    let processedContent = markdown;

    // Extract iframes and validate them
    const iframeRegex = /<iframe[^>]+src="([^"]+)"[^>]*>.*?<\/iframe>/gis;
    const iframes = [];
    let match;

    while ((match = iframeRegex.exec(markdown)) !== null) {
      const src = match[1];
      // Whitelist: YouTube, Vimeo
      if (
        /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//.test(
          src
        )
      ) {
        iframes.push(match[0]);
      }
    }

    // Remove iframes from markdown content (they'll be added back as HTML)
    processedContent = markdown.replace(iframeRegex, "");

    return { processedContent, iframes };
  };

  const { processedContent, iframes } = processContent(content);

  return (
    <div className={`markdown-preview prose dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          code: ({
            node,
            inline,
            className: codeClassName,
            children,
            ...props
          }) => {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`${codeClassName || ""} `} {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 bg-gray-50 dark:bg-gray-800 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Render whitelisted iframes */}
      {iframes.length > 0 && (
        <div className="mt-4">
          {iframes.map((iframe, index) => (
            <div
              key={index}
              className="my-4 responsive-iframe-container"
              dangerouslySetInnerHTML={{ __html: iframe }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;

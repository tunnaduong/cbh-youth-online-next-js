import React, { useState } from "react";
import Link from "next/link";

export default function TruncateText({ text, maxLength = 400 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Render the full text if it's less than or equal to the maxLength
  if (text.length <= maxLength) {
    return <div dangerouslySetInnerHTML={{ __html: text }}></div>;
  }

  // Truncate the text and add ellipsis if not expanded
  const truncatedText = isExpanded ? text : `${text.slice(0, maxLength)}...`;

  return (
    <div className="space-y-2">
      <div>
        {/* Use a span instead of a p to avoid block-level styling */}
        <span dangerouslySetInnerHTML={{ __html: truncatedText }} />
        {!isExpanded && (
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="text-primary hover:underline text-[11px] font-medium"
          >
            Xem thêm
          </Link>
        )}
      </div>
    </div>
  );
}

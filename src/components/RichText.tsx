"use client";

import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

type Part = { type: "text" | "math"; value: string; display?: boolean };

function splitMath(text: string): Part[] {
  const parts: Part[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: "text", value: text.slice(last, index) });
    if (match[1]) parts.push({ type: "math", value: match[1], display: true });
    else if (match[2]) parts.push({ type: "math", value: match[2], display: false });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export function RichText({ text }: { text: string }) {
  const parts = useMemo(() => splitMath(text), [text]);
  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, index) => {
        if (part.type === "text") return <span key={index}>{part.value}</span>;
        const html = katex.renderToString(part.value, {
          throwOnError: false,
          displayMode: part.display,
          trust: false,
        });
        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </div>
  );
}

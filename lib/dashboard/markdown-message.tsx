"use client";

import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const baseMarkdownClassName = clsx(
  "min-w-0 max-w-none break-words text-[14px]",
  "prose prose-invert",
  "prose-p:my-0 prose-p:leading-[1.6]",
  "prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold prose-headings:tracking-[-0.02em]",
  "prose-strong:text-inherit",
  "prose-a:text-[#F2C744] prose-a:no-underline hover:prose-a:underline",
  "prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-1 prose-li:marker:text-current",
  "prose-blockquote:my-3 prose-blockquote:border-l-[#3D3B36] prose-blockquote:text-inherit",
  "prose-hr:my-4 prose-hr:border-[#26241F]",
  "prose-pre:my-3 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-[#3D3B36] prose-pre:bg-[#161410] prose-pre:px-4 prose-pre:py-3",
  "prose-code:rounded prose-code:bg-[#161410] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.92em] prose-code:text-inherit prose-code:before:content-none prose-code:after:content-none",
  "prose-table:my-3 prose-th:border prose-th:border-[#3D3B36] prose-th:px-2 prose-th:py-1 prose-td:border prose-td:border-[#26241F] prose-td:px-2 prose-td:py-1"
);

export function MarkdownMessage({
  text,
  variant,
}: {
  text: string;
  variant: "user" | "assistant";
}) {
  return (
    <div
      className={clsx(
        baseMarkdownClassName,
        variant === "user"
          ? "prose-headings:text-[#FAFAF7] prose-p:text-[#FAFAF7] prose-li:text-[#FAFAF7] prose-td:text-[#FAFAF7] prose-th:text-[#FAFAF7] prose-blockquote:text-[#ECEAE3]"
          : "prose-headings:text-[#FAFAF7] prose-p:text-[#E6E3DA] prose-li:text-[#E6E3DA] prose-td:text-[#E6E3DA] prose-th:text-[#FAFAF7] prose-blockquote:text-[#BFBCB1]"
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

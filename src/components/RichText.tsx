import { Fragment } from "react";
import { parseTags } from "../lib/tags";

type RichTextProps = {
  text: string;
  className?: string;
  /** Colour the tappable parts take. Defaults to the brand purple. */
  tagClassName?: string;
  onHashtag?: (value: string) => void;
  onMention?: (handle: string) => void;
};

/**
 * Renders post text with its #hashtags and @mentions tappable. A tag stays
 * plain text whenever the caller has nowhere to send it.
 */
export function RichText({
  text,
  className,
  tagClassName = "text-brand",
  onHashtag,
  onMention,
}: RichTextProps) {
  const segments = parseTags(text);
  const tagClass = `pointer-events-auto rounded-[3px] font-extrabold underline-offset-2 hover:underline ${tagClassName}`;

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "hashtag" && onHashtag) {
          return (
            <button
              key={index}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onHashtag(segment.value);
              }}
              aria-label={`Search posts tagged ${segment.raw}`}
              className={tagClass}
            >
              {segment.raw}
            </button>
          );
        }

        if (segment.type === "mention" && onMention) {
          return (
            <button
              key={index}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMention(segment.handle);
              }}
              aria-label={`Open ${segment.raw}'s profile`}
              className={tagClass}
            >
              {segment.raw}
            </button>
          );
        }

        return <Fragment key={index}>{segment.type === "text" ? segment.text : segment.raw}</Fragment>;
      })}
    </span>
  );
}

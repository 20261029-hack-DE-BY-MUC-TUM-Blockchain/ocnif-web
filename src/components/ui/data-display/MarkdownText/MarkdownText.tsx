import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownText.module.css";
export function MarkdownText({ children }: { children: string }) {
  return (
    <div className={styles.markdown}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={[
          "img",
          "iframe",
          "script",
          "style",
          "form",
          "input",
        ]}
        components={{ a: ({ children }) => <span>{children}</span> }}
      >
        {children}
      </Markdown>
    </div>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/atom-one-dark.css';

interface MarkdownProps {
  content: string;
}

// Custom plugin to replace Codeforces `$$$` math blocks with standard `$$`
function preprocessMath(content: string) {
  return content.replace(/\$\$\$/g, '$$');
}

export function Markdown({ content }: MarkdownProps) {
  const processedContent = preprocessMath(content);

  return (
    <div className="prose prose-invert max-w-none prose-pre:my-2 prose-pre:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

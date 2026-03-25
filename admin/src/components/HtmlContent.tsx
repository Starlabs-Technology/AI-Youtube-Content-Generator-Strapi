import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@strapi/design-system';
import client from '../api/client';

interface HtmlContentProps {
  jobId: number;
  fallbackText?: string;
}

// Simple markdown-to-HTML converter used when the server render endpoint is unavailable
function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  const html = markdown
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)(\n(?!<li>)|$)/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

const STYLE_ID = 'aiya-article-styles';
const articleCss = `
  .aiya-article-content h1 { font-size: 1.5rem; font-weight: 700; margin: 1.2rem 0 0.5rem; line-height: 1.3; }
  .aiya-article-content h2 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.4rem; line-height: 1.3; }
  .aiya-article-content h3 { font-size: 1.1rem; font-weight: 600; margin: 0.8rem 0 0.3rem; }
  .aiya-article-content h4, .aiya-article-content h5, .aiya-article-content h6 { font-size: 1rem; font-weight: 600; margin: 0.6rem 0 0.3rem; }
  .aiya-article-content p { margin: 0 0 0.8rem; line-height: 1.7; }
  .aiya-article-content ul, .aiya-article-content ol { padding-left: 1.5rem; margin: 0.5rem 0 0.8rem; }
  .aiya-article-content li { margin-bottom: 0.3rem; line-height: 1.6; }
  .aiya-article-content strong, .aiya-article-content b { font-weight: 700; }
  .aiya-article-content em, .aiya-article-content i { font-style: italic; }
  .aiya-article-content blockquote { border-left: 3px solid #ccc; margin: 0.8rem 0; padding: 0.4rem 0 0.4rem 1rem; color: #555; }
  .aiya-article-content code { background: rgba(0,0,0,0.06); padding: 0.1rem 0.3rem; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
  .aiya-article-content pre { background: rgba(0,0,0,0.06); padding: 1rem; border-radius: 4px; overflow-x: auto; margin: 0.8rem 0; }
  .aiya-article-content a { color: #4945ff; text-decoration: underline; }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = articleCss;
  document.head.appendChild(style);
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ jobId, fallbackText }) => {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ensureStyles();
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await client.get(`/jobs/${jobId}/render`);
        if (!mounted) return;
        setHtml(res.data?.data?.html ?? null);
      } catch {
        if (!mounted) return;
        setHtml(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [jobId]);

  if (loading) return <Typography>Loading preview…</Typography>;

  const content = html ?? (fallbackText ? markdownToHtml(fallbackText) : null);
  if (!content) return <Typography>No article content available.</Typography>;

  return (
    <Box>
      <div className="aiya-article-content" dangerouslySetInnerHTML={{ __html: content }} />
    </Box>
  );
};

export default HtmlContent;

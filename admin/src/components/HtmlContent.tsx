import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';

interface HtmlContentProps {
  jobId: number;
  fallbackText?: string;
}

export const HtmlContent: React.FC<HtmlContentProps> = ({ jobId, fallbackText }) => {
  const { get } = useFetchClient();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await get(`/api/ai-youtube-article/jobs/${jobId}/render`);
        if (!mounted) return;
        setHtml(res.data?.data?.html ?? null);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Failed to load content');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [jobId, get]);

  if (loading) return <Typography>Loading preview…</Typography>;
  if (error) return <Typography>{fallbackText ?? 'No article content available.'}</Typography>;
  if (!html) return <Typography>{fallbackText ?? 'No article content available.'}</Typography>;

  return (
    <Box>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Box>
  );
};

export default HtmlContent;

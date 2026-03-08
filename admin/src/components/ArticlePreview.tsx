import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, Flex, Accordion, Grid } from '@strapi/design-system';
import { File, Information, Eye } from '@strapi/icons';
import { useFetchClient } from '@strapi/strapi/admin';
import HtmlContent from './HtmlContent';
import type { Job } from '../api/types';

interface ArticlePreviewProps {
  job: Job;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({ job }) => {
  const [expandedId, setExpandedId] = useState<string>('summary');

  const getFirstParagraph = (content?: string | null): string | undefined => {
    if (!content) return undefined;
    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    return paragraphs.length > 0 ? paragraphs[0] : undefined;
  };

  const firstParagraph = getFirstParagraph(job.articleContent);
  const title = job.articleTitle ?? firstParagraph;

  // Render only when we have at least a title, a summary, or content
  if (!title && !job.articleSummary && !job.articleContent) {
    return null;
  }

  return (
    <Box
      background="neutral0"
      padding={8}
      shadow="tableShadow"
      hasRadius
    >
      <Flex direction="column" alignItems="stretch" gap={6}>
        {/* Title Section */}
        <Box>
          <Typography variant="pi" textColor="neutral600" fontWeight="semiBold" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Generated Article
          </Typography>
          <Typography variant="beta" fontWeight="bold" paddingTop={2}>
            {title}
          </Typography>
        </Box>

        <Divider />

        {/* Collapsible Content Sections */}
        <Accordion.Root value={expandedId} onValueChange={setExpandedId}>
          {/* Summary Section */}
          {job.articleSummary && (
            <Accordion.Item value="summary">
              <Accordion.Header>
                <Accordion.Trigger>
                  <Flex gap={2} alignItems="center">
                    <Information />
                    <Typography variant="delta" fontWeight="semiBold">
                      Summary
                    </Typography>
                  </Flex>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={4} background="neutral100" hasRadius>
                  <Typography variant="omega" textColor="neutral700" style={{ lineHeight: '1.6' }}>
                    {job.articleSummary}
                  </Typography>
                </Box>
              </Accordion.Content>
            </Accordion.Item>
          )}

          {/* Content Section */}
          {job.articleContent && (
            <Accordion.Item value="content">
              <Accordion.Header>
                <Accordion.Trigger>
                  <Flex gap={2} alignItems="center">
                    <Eye />
                    <Typography variant="delta" fontWeight="semiBold">
                      Full Content
                    </Typography>
                  </Flex>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box 
                  padding={4} 
                  background="neutral100" 
                  hasRadius
                  style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                  }}
                >
                  <HtmlContent jobId={job.id} fallbackText={job.articleContent} />
                </Box>
              </Accordion.Content>
            </Accordion.Item>
          )}

          {/* Metadata Section */}
          {job.metadata && (
            <Accordion.Item value="metadata">
              <Accordion.Header>
                <Accordion.Trigger>
                  <Flex gap={2} alignItems="center">
                    <File />
                    <Typography variant="delta" fontWeight="semiBold">
                      Metadata
                    </Typography>
                  </Flex>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box padding={4} background="neutral100" hasRadius>
                  <Grid.Root gap={4}>
                    <Grid.Item col={4} s={6} xs={12}>
                      <Typography variant="pi" textColor="neutral600" fontWeight="semiBold">
                        Language
                      </Typography>
                      <Typography variant="omega" textColor="neutral800" paddingTop={1}>
                        {job.metadata?.language || 'Unknown'}
                      </Typography>
                    </Grid.Item>
                    {job.metadata?.duration_seconds && (
                      <Grid.Item col={4} s={6} xs={12}>
                        <Typography variant="pi" textColor="neutral600" fontWeight="semiBold">
                          Duration
                        </Typography>
                        <Typography variant="omega" textColor="neutral800" paddingTop={1}>
                          {formatDuration(job.metadata?.duration_seconds!)}
                        </Typography>
                      </Grid.Item>
                    )}

                    {/* Processing time: support both the older `processing_time_seconds` and the new `processing_time` key */}
                    {(job.metadata?.processing_time !== undefined || job.metadata?.processing_time_seconds !== undefined) && (
                      <Grid.Item col={4} s={6} xs={12}>
                        <Typography variant="pi" textColor="neutral600" fontWeight="semiBold">
                          Processing Time
                        </Typography>
                        <Typography variant="omega" textColor="neutral800" paddingTop={1}>
                          {`${(job.metadata?.processing_time ?? job.metadata?.processing_time_seconds)}s`}
                        </Typography>
                      </Grid.Item>
                    )}

                    {/* Model used */}
                    {(job.metadata?.model_used || job.metadata?.modelUsed) && (
                      <Grid.Item col={4} s={6} xs={12}>
                        <Typography variant="pi" textColor="neutral600" fontWeight="semiBold">
                          Model
                        </Typography>
                        <Typography variant="omega" textColor="neutral800" paddingTop={1}>
                          {job.metadata?.model_used ?? job.metadata?.modelUsed}
                        </Typography>
                      </Grid.Item>
                    )}

                    {/* Source URL */}
                    {(job.metadata?.source_url || job.metadata?.sourceUrl) && (
                      <Grid.Item col={12} s={12} xs={12}>
                        <Typography variant="pi" textColor="neutral600" fontWeight="semiBold">
                          Source URL
                        </Typography>
                        <Typography variant="omega" textColor="neutral800" paddingTop={1}>
                          {job.metadata?.source_url ?? job.metadata?.sourceUrl}
                        </Typography>
                      </Grid.Item>
                    )} 
                  </Grid.Root>
                </Box>
              </Accordion.Content>
            </Accordion.Item>
          )}
        </Accordion.Root>
      </Flex>
    </Box>
  );
};

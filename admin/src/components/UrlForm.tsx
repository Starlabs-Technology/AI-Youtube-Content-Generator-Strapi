import React, { useState } from 'react';
import { TextInput, Button, Box, Field } from '@strapi/design-system';
import { Play } from '@strapi/icons';

interface UrlFormProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;

export const UrlForm: React.FC<UrlFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('YouTube URL is required');
      return;
    }

    if (!YOUTUBE_REGEX.test(url)) {
      setError('Invalid YouTube URL format');
      return;
    }

    setError('');
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box paddingBottom={5}>
        <Field.Root
          name="youtubeUrl"
          required
          error={error}
        >
          <Field.Label>YouTube Video URL</Field.Label>
          <TextInput
            placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            disabled={isLoading}
            size="M"
          />
          <Field.Hint>
            Paste the full URL of a YouTube video to transcribe and generate an article
          </Field.Hint>
          {error && <Field.Error>{error}</Field.Error>}
        </Field.Root>
      </Box>
      <Button
        type="submit"
        startIcon={<Play />}
        loading={isLoading}
        disabled={isLoading}
        size="L"
        style={{ minWidth: '180px' }}
      >
        {isLoading ? 'Processing...' : 'Start Processing'}
      </Button>
    </form>
  );
};

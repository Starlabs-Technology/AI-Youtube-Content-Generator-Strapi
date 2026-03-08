import React from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import SlsLogo from '../assets/sls-light-logo.png';

export const BrandingFooter: React.FC = () => (
  <Box paddingTop={8} paddingBottom={2}>
    <Box
      hasRadius
      padding={5}
      style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #e8e8ff 100%)',
        borderLeft: '4px solid #4945ff',
        boxShadow: '0 2px 10px rgba(73,69,255,0.1)',
      }}
    >
      <Flex direction="column" alignItems="center" gap={3}>
        <img
          src={SlsLogo}
          alt="Star Labs Technology"
          style={{ height: 40, display: 'block' }}
        />
        <Typography variant="sigma" fontWeight="bold" textColor="neutral900">
          Plugin By{' '}
          <span style={{ color: '#4945ff' }}>Star Labs Technology</span>
        </Typography>
        <Flex alignItems="center" gap={1}>
          <Typography variant="pi" textColor="neutral600">
            Website:&nbsp;
          </Typography>
          <a
            href="https://starlabs.net.au"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#4945ff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            starlabs.net.au
          </a>
        </Flex>
      </Flex>
    </Box>
  </Box>
);

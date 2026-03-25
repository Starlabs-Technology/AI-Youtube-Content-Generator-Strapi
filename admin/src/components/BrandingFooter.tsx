import React from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import SlsLogo from '../assets/sls-light-logo.png';

export const BrandingFooter: React.FC = () => (
  <Box paddingTop={8} paddingBottom={2}>
    <Box
      hasRadius
      padding={5}
      style={{
        background: '#1a1a2e',
        borderLeft: '4px solid #4945ff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      <Flex direction="column" alignItems="center" gap={3}>
        <img
          src={SlsLogo}
          alt="Star Labs Technology"
          style={{ height: 40, display: 'block' }}
        />
        <Typography variant="sigma" fontWeight="bold" style={{ color: '#ffffff' }}>
          Plugin By{' '}
          <span style={{ color: '#7b79ff' }}>Star Labs Technology</span>
        </Typography>
        <Flex alignItems="center" gap={1}>
          <Typography variant="pi" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Website:&nbsp;
          </Typography>
          <a
            href="https://starlabs.net.au"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#7b79ff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.05rem',
            }}
          >
            starlabs.net.au
          </a>
        </Flex>
      </Flex>
    </Box>
  </Box>
);

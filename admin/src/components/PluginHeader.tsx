import React from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import SlsLogo from '../assets/sls-light-logo.png';

interface Props {
  title: string;
  subtitle?: string;
  primaryAction?: React.ReactNode;
}

export const PluginHeader: React.FC<Props> = ({ title, subtitle, primaryAction }) => (
  <Box
    paddingTop={6}
    paddingBottom={6}
    paddingLeft={10}
    paddingRight={10}
    background="neutral0"
    style={{
      borderBottom: '1px solid #eaeaef',
      position: 'relative',
    }}
  >
    <Flex alignItems="center" justifyContent="space-between">
      {/* Left: Title & Subtitle */}
      <Flex direction="column" gap={1} style={{ alignItems: 'flex-start' }}>
        <Typography variant="alpha" fontWeight="bold" style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="pi" textColor="neutral600">
            {subtitle}
          </Typography>
        )}
      </Flex>

      {/* Right: Primary Action */}
      {primaryAction && <Box>{primaryAction}</Box>}
    </Flex>

    {/* Center: Star Labs Logo (absolutely centered) */}
    <Box
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      <img
        src={SlsLogo}
        alt="Star Labs Technology"
        style={{ height: 42, display: 'block' }}
      />
    </Box>
  </Box>
);

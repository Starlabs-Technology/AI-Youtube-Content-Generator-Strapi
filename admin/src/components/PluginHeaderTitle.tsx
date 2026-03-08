import React from 'react';
import { Flex, Typography } from '@strapi/design-system';
import SlsLogo from '../assets/sls-light-logo.png';

interface Props {
  title: string;
  subtitle?: string;
}

export const PluginHeaderTitle: React.FC<Props> = ({ title, subtitle }) => (
  <Flex alignItems="center" gap={4}>
    <img
      src={SlsLogo}
      alt="Star Labs Technology"
      style={{ height: 42, display: 'block', flexShrink: 0 }}
    />
    <Flex direction="column" gap={1}>
      <Typography variant="alpha" fontWeight="bold">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="pi" textColor="neutral600">
          {subtitle}
        </Typography>
      )}
    </Flex>
  </Flex>
);

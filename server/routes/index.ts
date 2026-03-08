import { createContentApiRoutesFactory } from '@strapi/utils';

const createRoutes = createContentApiRoutesFactory(() => {
  return [
    {
      method: 'POST',
      path: '/jobs',
      handler: 'ai-job.create',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'GET',
      path: '/jobs',
      handler: 'ai-job.find',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'GET',
      path: '/jobs/summary',
      handler: 'ai-job.summary',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'GET',
      path: '/jobs/:id',
      handler: 'ai-job.findOne',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'GET',
      path: '/jobs/:id/render',
      handler: 'ai-job.render',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'POST',
      path: '/jobs/:id/create-article',
      handler: 'ai-job.createArticle',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'POST',
      path: '/jobs/:id/retry',
      handler: 'ai-job.retry',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'DELETE',
      path: '/jobs/:id',
      handler: 'ai-job.delete',
      config: {
        policies: [],
        auth: { scope: ['admin'] },
      },
    },
    {
      method: 'GET',
      path: '/health',
      handler: 'ai-job.health',
      config: {
        policies: [],
        auth: false,
      },
    },

  ];
});

import admin from './admin';

export default {
  'content-api': createRoutes,
  admin,
};

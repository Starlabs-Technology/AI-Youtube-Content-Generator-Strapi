export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/settings',
      handler: 'settings.find',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'PUT',
      path: '/settings',
      handler: 'settings.update',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'POST',
      path: '/test-connection',
      handler: 'settings.testConnection',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    // Job Management Routes
    {
      method: 'GET',
      path: '/jobs/summary',
      handler: 'ai-job.summary',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/jobs',
      handler: 'ai-job.find',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'POST',
      path: '/jobs',
      handler: 'ai-job.create',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/jobs/:id',
      handler: 'ai-job.findOne',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/jobs/:id/render',
      handler: 'ai-job.render',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'POST',
      path: '/jobs/:id/create-article',
      handler: 'ai-job.createArticle',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'POST',
      path: '/jobs/:id/retry',
      handler: 'ai-job.retry',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'POST',
      path: '/jobs/:id/refresh',
      handler: 'ai-job.refresh',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'DELETE',
      path: '/jobs/:id',
      handler: 'ai-job.delete',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
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
  ],
};

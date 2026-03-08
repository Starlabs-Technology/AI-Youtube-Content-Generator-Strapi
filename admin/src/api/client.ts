import { getFetchClient } from '@strapi/admin/strapi-admin';

// Plugin route prefix — Strapi v5 registers admin plugin routes at /<plugin-uid>/...
// getFetchClient() already includes the admin JWT in the Authorization header.
const PREFIX = '/ai-youtube-article';

const { get, post, put: fetchPut, del } = getFetchClient();

export default {
  get: (url: string, config?: any) => get(`${PREFIX}${url}`, config),
  post: (url: string, data?: any, config?: any) => post(`${PREFIX}${url}`, data, config),
  put: (url: string, data?: any, config?: any) => fetchPut(`${PREFIX}${url}`, data, config),
  delete: (url: string, config?: any) => del(`${PREFIX}${url}`, config),
};

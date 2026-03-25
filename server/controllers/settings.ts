export default ({ strapi }) => ({
  async find(ctx) {
    ctx.body = await strapi
      .plugin('ai-youtube-article')
      .service('settings')
      .getSettings();
  },

  async update(ctx) {
    const { body } = ctx.request;
    
    ctx.body = await strapi
      .plugin('ai-youtube-article')
      .service('settings')
      .updateSettings(body);
  },

  async testConnection(ctx) {
    try {
      const settings = await strapi
        .plugin('ai-youtube-article')
        .service('settings')
        .getSettings();

      const result = await strapi
        .plugin('ai-youtube-article')
        .service('connection')
        .test(settings);

      ctx.body = {
        success: true,
        message: 'Settings saved — all services connected successfully',
        services: result,
      };
    } catch (error: any) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: error.message || 'Connection failed',
        services: error.services || null,
      };
    }
  },
});

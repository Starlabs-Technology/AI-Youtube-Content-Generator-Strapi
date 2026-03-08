import pluginId from './admin/src/pluginId';
import PluginIcon from './admin/src/components/PluginIcon';

export default {
  register(app) {
    app.addMenuLink({
      to: `plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'AI YouTube Article',
      },
      Component: async () => {
        const component = await import('./admin/src/pages/App');
        return component;
      },
      permissions: [
        {
          action: `plugin::${pluginId}.read`,
          subject: null,
        },
      ],
    });

    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: 'AI YouTube Article',
        },
      },
      [
        {
          intlLabel: {
            id: `${pluginId}.settings.title`,
            defaultMessage: 'Configuration',
          },
          id: 'settings',
          to: pluginId,
          Component: async () => {
            const component = await import('./admin/src/pages/Settings');
            return component;
          },
          permissions: [
            {
              action: `plugin::${pluginId}.settings`,
              subject: null,
            },
          ],
        },
      ]
    );

    app.registerPlugin({
      id: pluginId,
      name: 'AI YouTube Article',
    });
  },

  async registerTrads(app) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./admin/src/translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data,
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};

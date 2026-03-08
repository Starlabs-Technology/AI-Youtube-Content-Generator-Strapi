import pluginId from './pluginId';
import PluginIcon from './components/PluginIcon';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'AI YouTube Article',
      },
      Component: () => import('./pages/App'),
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
          Component: () => import('./pages/Settings'),
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

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
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

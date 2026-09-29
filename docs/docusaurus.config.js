// @ts-check

const config = {
  title: 'Fabriq',
  tagline: 'Техническая документация платформы моделирования производства',
  favicon: 'img/favicon.ico',

  url: process.env.DOCS_SITE_URL || 'https://ritoka.stopco.ru',
  baseUrl: process.env.DOCS_BASE_URL || '/docs/',

  organizationName: 'Rotorino',
  projectName: 'Fabriq',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Fabriq',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'coreSidebar',
          position: 'left',
          label: 'Документация',
        },
        {
          href: 'https://ritoka.stopco.ru/fabriq',
          label: 'Приложение',
          position: 'right',
        },
        {
          href: 'https://ritoka.stopco.ru/preza/',
          label: 'Презентация',
          position: 'right',
        },
        {
          href: 'https://github.com/Rotorino/Fabriq/tree/Dev',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Разделы',
          items: [
            {
              label: 'Обзор системы',
              to: '/',
            },
            {
              label: 'Эксплуатация',
              to: '/operations',
            },
          ],
        },
        {
          title: 'Проект',
          items: [
            {
              label: 'Репозиторий',
              href: 'https://github.com/Rotorino/Fabriq/tree/Dev',
            },
            {
              label: 'Рабочее приложение',
              href: 'https://ritoka.stopco.ru/fabriq',
            },
            {
              label: 'Презентация',
              href: 'https://ritoka.stopco.ru/preza/',
            },
          ],
        },
      ],
      copyright: `Fabriq — документация web-платформы и движка моделирования.`,
    },
    prism: {
      additionalLanguages: ['python'],
    },
  },
};

module.exports = config;

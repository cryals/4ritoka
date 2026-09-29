// @ts-check

const sidebars = {
  coreSidebar: [
    'index',
    {
      type: 'category',
      label: 'Начало работы',
      collapsed: false,
      items: ['USER_GUIDE', 'presentation'],
    },
    {
      type: 'category',
      label: 'Web-платформа',
      collapsed: false,
      items: ['web-application', 'api-reference', 'configuration'],
    },
    {
      type: 'category',
      label: 'Движок моделирования',
      items: [
        'architecture',
        'scenario-module',
        'event-flow',
        'analytics_module',
        'simulation-result',
        'visualization_module',
        'integration-contract',
        'full-application',
      ],
    },
    {
      type: 'category',
      label: 'Разработка и эксплуатация',
      collapsed: false,
      items: ['DEVELOPER_GUIDE', 'testing', 'deployment', 'operations'],
    },
  ],
};

module.exports = sidebars;

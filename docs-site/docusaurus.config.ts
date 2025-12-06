import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TunnelAPI Documentation',
  tagline: 'Secure tunneling, webhook testing, and API collaboration for developers',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.tunnelapi.in',
  baseUrl: '/',

  organizationName: 'vijaypurohit322',
  projectName: 'api-response-manager',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/vijaypurohit322/api-response-manager/tree/main/docs-site/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/tunnelapi-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: 'support_us',
      content: '⭐ If you like TunnelAPI, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/vijaypurohit322/api-response-manager">GitHub</a>!',
      backgroundColor: '#4f46e5',
      textColor: '#ffffff',
      isCloseable: true,
    },
    navbar: {
      title: 'TunnelAPI',
      logo: {
        alt: 'TunnelAPI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/cli/overview',
          label: 'CLI Reference',
          position: 'left',
        },
        {
          to: '/api/authentication',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'https://tunnelapi.in',
          label: 'Dashboard',
          position: 'right',
        },
        {
          href: 'https://github.com/vijaypurohit322/api-response-manager',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/' },
            { label: 'CLI Reference', to: '/cli/overview' },
            { label: 'Tunneling Guide', to: '/tunneling/setup' },
            { label: 'Webhook Guide', to: '/webhooks/overview' },
          ],
        },
        {
          title: 'Product',
          items: [
            { label: 'Dashboard', href: 'https://tunnelapi.in' },
            { label: 'Pricing', href: 'https://tunnelapi.in/#pricing' },
            { label: 'Status', href: 'https://tunnelapi.in' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/vijaypurohit322/api-response-manager' },
            { label: 'Issues', href: 'https://github.com/vijaypurohit322/api-response-manager/issues' },
            { label: 'Discussions', href: 'https://github.com/vijaypurohit322/api-response-manager/discussions' },
          ],
        },
        {
          title: 'Legal',
          items: [
            { label: 'Privacy Policy', href: 'https://tunnelapi.in/privacy' },
            { label: 'Terms of Service', href: 'https://tunnelapi.in/terms' },
            { label: 'License', href: 'https://github.com/vijaypurohit322/api-response-manager/blob/main/LICENSE' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TunnelAPI by Vijay Singh Purohit. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml'],
    },
    algolia: undefined,
  } satisfies Preset.ThemeConfig,
};

export default config;

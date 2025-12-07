import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/docker-setup',
      ],
    },
    {
      type: 'category',
      label: 'CLI Reference',
      items: [
        'cli/overview',
        'cli/authentication',
        'cli/tunnels',
        'cli/webhooks',
        'cli/projects',
      ],
    },
    {
      type: 'category',
      label: 'Tunneling',
      items: [
        'tunneling/setup',
        'tunneling/custom-domains',
        'tunneling/authentication',
        'tunneling/rate-limiting',
      ],
    },
    {
      type: 'category',
      label: 'Webhooks',
      items: [
        'webhooks/overview',
        'webhooks/creating-endpoints',
        'webhooks/forwarding',
        'webhooks/integrations',
      ],
    },
    {
      type: 'category',
      label: 'Authentication',
      items: [
        'auth/overview',
        'auth/google-oauth',
        'auth/github-oauth',
        'auth/microsoft-oauth',
        'auth/saml-sso',
      ],
    },
    {
      type: 'category',
      label: 'Self-Hosting',
      items: [
        'self-hosting/requirements',
        'self-hosting/docker-deployment',
        'self-hosting/nginx-setup',
        'self-hosting/scaling',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/overview',
        'security/ip-whitelisting',
        'security/encryption',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/authentication',
        'api/projects',
        'api/tunnels',
        'api/webhooks',
      ],
    },
  ],
};

export default sidebars;

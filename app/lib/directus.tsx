import { createDirectus, rest } from '@directus/sdk';

let _client: any;

export function getDirectus() {
  const baseUrl = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost';
  if (!_client) {
    _client = createDirectus<any>(baseUrl).with(
      rest({
        onRequest: (options) => ({ ...options, cache: 'no-store' }),
      })
    );
  }
  return _client;
}

export default getDirectus;
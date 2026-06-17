import * as Linking from 'expo-linking';

import { APP_WEB_URL } from '../config/appUrl';

const prefixes = [
  Linking.createURL('/'),
  'fena://',
  `${APP_WEB_URL}/`,
];

export const linkingConfig = {
  prefixes,
  config: {
    screens: {
      Splash: 'splash',
      SignIn: 'signin',
      MainTabs: {
        screens: {
          Home: 'home',
          Explore: 'explore',
          Map: 'map',
          Collections: 'collections',
          Profile: 'profile',
        },
      },
      SpotDetail: {
        path: 's/:spotId',
        parse: { spotId: (id) => String(id) },
      },
      CollectionDetail: {
        path: 'p/:id',
        parse: { id: (value) => String(value) },
      },
    },
  },
};

export function parseShareDeepLink(url) {
  if (!url) return null;

  const spotMatch = url.match(/\/s\/([^/?#]+)/i) || url.match(/spot\/([^/?#]+)/i);
  if (spotMatch?.[1]) {
    return { type: 'spot', spotId: decodeURIComponent(spotMatch[1]) };
  }

  const pocketMatch = url.match(/\/p\/([^/?#]+)/i);
  if (pocketMatch?.[1]) {
    return { type: 'collection', collectionId: decodeURIComponent(pocketMatch[1]) };
  }

  return null;
}

import { useEffect } from 'react';
import * as Linking from 'expo-linking';

import { track, Events } from '../analytics';
import { parseShareDeepLink } from '../navigation/linking';

function trackShareUrl(url, coldStart = false) {
  if (!url) return;
  const target = parseShareDeepLink(url);
  if (!target) return;

  if (target.type === 'spot' && target.spotId) {
    track(Events.SHARE_LINK_OPENED, {
      target: 'spot',
      spot_id: target.spotId,
      cold_start: coldStart,
    });
    return;
  }

  if (target.type === 'collection' && target.collectionId) {
    track(Events.SHARE_LINK_OPENED, {
      target: 'collection',
      collection_id: target.collectionId,
      cold_start: coldStart,
    });
  }
}

/** Analytics for share deep links — navigation is handled by linking config. */
export default function ShareDeepLinkHandler() {
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => trackShareUrl(url, true))
      .catch(() => {});

    const sub = Linking.addEventListener('url', ({ url }) => trackShareUrl(url, false));
    return () => sub.remove();
  }, []);

  return null;
}

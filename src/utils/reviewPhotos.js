/** URLs that React Native Image can load in review cards. */
export function getDisplayableReviewPhotos(review) {
  const photos = Array.isArray(review?.photos) ? review.photos : [];
  return photos.filter(
    (uri) => typeof uri === 'string' && /^https?:\/\//i.test(uri.trim()),
  );
}

export function isLocalImageUri(uri) {
  return (
    typeof uri === 'string' &&
    /^(file|content|ph|assets-library):/i.test(uri.trim())
  );
}

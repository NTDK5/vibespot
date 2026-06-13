export const REVIEW_VISIT_REQUIRED_MESSAGE =
  "Stamp your visit first — only people who've been here can leave a review.";

export function showReviewVisitRequiredToast(toast) {
  toast?.show?.(REVIEW_VISIT_REQUIRED_MESSAGE, { variant: 'info' });
}

/**
 * Navigate to WriteReview only when the user has stamped this spot.
 * @returns {boolean} true if navigation was allowed
 */
export function tryNavigateToWriteReview({ navigation, spotId, visited, toast, user }) {
  if (!spotId) return false;
  if (!user) {
    toast?.show?.('Sign in to write a review.', { variant: 'info' });
    return false;
  }
  if (!visited) {
    showReviewVisitRequiredToast(toast);
    return false;
  }
  navigation.navigate('WriteReview', { spotId });
  return true;
}

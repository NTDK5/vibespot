import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'fena.editorsChallengeCelebrated.';

export async function wasEditorsChallengeCelebrated(challengeKey) {
  if (!challengeKey) return true;
  try {
    return (await AsyncStorage.getItem(`${PREFIX}${challengeKey}`)) === '1';
  } catch {
    return false;
  }
}

export async function markEditorsChallengeCelebrated(challengeKey) {
  if (!challengeKey) return;
  try {
    await AsyncStorage.setItem(`${PREFIX}${challengeKey}`, '1');
  } catch {
    /* non-fatal */
  }
}

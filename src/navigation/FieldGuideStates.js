/**
 * Field Guide global state helpers.
 *
 * Thin wrappers around `AppStatusContext` so screens can stay readable.
 */

import {
  AppStatusProvider,
  useAppStatus,
  useOffline,
} from '../context/AppStatusContext';

export { AppStatusProvider, useAppStatus, useOffline };

export function useShowSuccessSheet() {
  const { showSuccessSheet } = useAppStatus();
  return showSuccessSheet;
}

export function useShowErrorScreen() {
  const { showErrorScreen } = useAppStatus();
  return showErrorScreen;
}

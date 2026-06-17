import { useApiReady } from '../hooks/useApiReady';

/** Pings backend health in the background — does not block navigation. */
export default function ApiReadyWarmup() {
  useApiReady();
  return null;
}

/**
 * Session expiry bus — axios emits once; AuthContext clears auth once.
 */

const listeners = new Set();

export const authEvents = {
  emitSessionExpired() {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore listener errors */
      }
    });
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

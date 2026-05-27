/**
 * Lightweight network status bus for axios ↔ AppStatusContext.
 */

const offlineListeners = new Set();
let axiosOffline = false;

export const networkEvents = {
  /** Axios reports a failed request with no response (after retry). */
  setOffline(value) {
    axiosOffline = !!value;
    offlineListeners.forEach((fn) => fn());
  },

  getAxiosOffline() {
    return axiosOffline;
  },

  subscribe(listener) {
    offlineListeners.add(listener);
    return () => offlineListeners.delete(listener);
  },
};

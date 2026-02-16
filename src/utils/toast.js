// Backward-compatible export: now routed through the in-app themed toast.
import { showToast as busShowToast } from "./toastBus";

export function showToast(message, _title) {
  busShowToast(message, { variant: "error" });
}



export type ToastKind = "ok" | "err" | "info";

export function toast(message: string, kind: ToastKind = "ok") {
  window.dispatchEvent(
    new CustomEvent("cf-toast", { detail: { message, kind, id: Date.now() + Math.random() } })
  );
}

export type NotificationEvent = {
  id: string;
  title: string;
  detail: string;
  type: "info" | "success" | "warning" | "error";
};

export const NOTIFICATION_EVENT = "cardio:notification";

export function dispatchNotification(notification: NotificationEvent) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<NotificationEvent>(NOTIFICATION_EVENT, {
        detail: notification
      })
    );
  }
}

export function addNotificationListener(
  callback: (notification: NotificationEvent) => void
) {
  if (typeof window !== "undefined") {
    const handler = (event: CustomEvent<NotificationEvent>) => {
      callback(event.detail);
    };
    window.addEventListener(NOTIFICATION_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handler as EventListener);
    };
  }
  return () => {};
}

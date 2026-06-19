self.addEventListener("push", (event) => {
  let data = { title: "Dwellio", body: "You have a new notification" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // ignore malformed payload
  }

  const title = data.title ?? "Dwellio";
  const options = {
    body: data.body ?? "",
    data: data.data ?? data,
    tag: data.type ?? "dwellio-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath =
    event.notification.data?.targetPath ??
    event.notification.data?.data?.targetPath ??
    "/app/notifications";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(targetPath);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    }),
  );
});

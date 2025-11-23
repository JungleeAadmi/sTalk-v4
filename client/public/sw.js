// Force Immediate Activation
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// 1. Listen for Push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  event.waitUntil(
    self.registration.showNotification(data.title || "sTalk", {
      body: data.body || "New Message",
      icon: "/logo.png", // Android Only
      badge: "/logo.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" }
    })
  );
});

// 2. Handle Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If app is open, focus it
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      // If closed, open it
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});

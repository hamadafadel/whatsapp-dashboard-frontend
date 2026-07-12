const CACHE_NAME = "mehrab-dashboard-static-v5";

const STATIC_FILES = [
  "/manifest.json",
  "/mehrab-splash-192-v5.png",
  "/mehrab-splash-512-v5.png"
];

// تثبيت النسخة الجديدة فورًا
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
});

// حذف أي كاش قديم وتفعيل النسخة الجديدة فورًا
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// استقبال أمر التفعيل الفوري
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// التحكم في الطلبات
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا نتدخل في الـAPI أو الملفات المرفوعة
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }

  const isAppShell =
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/app.css") ||
    url.pathname.endsWith("/service-worker.js");

  // ملفات التطبيق البرمجية: دائمًا أحدث نسخة من السيرفر
  if (isAppShell) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      }).catch(() => {
        // ما نرجعش نسخة قديمة من app.js أو index.html
        return new Response(
          "Network unavailable",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
    );

    return;
  }

  // الأيقونات والـmanifest فقط: Cache First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (
          !networkResponse ||
          !networkResponse.ok ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }

        const responseCopy = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseCopy);
        });

        return networkResponse;
      });
    })
  );
});

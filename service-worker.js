const CACHE_NAME = "mehrab-dashboard-static-v1";

const STATIC_FILES = [
  "/manifest.json",
  "/icon-192-v2.png",
  "/icon-512-v2.png"
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

// منع كاش ملفات التطبيق البرمجية
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // الـAPI والملفات المرفوعة لا نتدخل فيها
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return;
  }

  // الصفحة وملفات الكود: دائمًا من السيرفر بدون كاش
  if (
    request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/app.js") ||
    url.pathname.endsWith("/app.css") ||
    url.pathname.endsWith("/service-worker.js")
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-store"
      })
    );

    return;
  }

  // الأيقونات والـmanifest فقط يمكن استخدام الكاش لها
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((networkResponse) => {
          const responseCopy = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseCopy);
          });

          return networkResponse;
        })
      );
    })
  );
});

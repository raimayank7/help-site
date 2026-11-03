/* GroupChatOn Help service worker: pages network first (always fresh), saved copy when offline; CSS/JS/fonts saved copy first. */
var V = 'b6143cd1', PAGES = 'help-pages-' + V, FILES = 'help-files-' + V;
self.addEventListener('install', function (e) { e.waitUntil(caches.open(PAGES).then(function (c) { return c.addAll(['/', '/offline.html']); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return /^help-/.test(k) && k !== PAGES && k !== FILES; }).map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); }));
});
var STATIC = /^https:\/\/(assets\.infinity\.groupchaton\.com|fonts\.(googleapis|gstatic)\.com)\//;
self.addEventListener('fetch', function (e) {
  var r = e.request, u = r.url;
  if (r.method !== 'GET') return;
  if (r.mode === 'navigate' && u.indexOf(self.location.origin) === 0) {
    e.respondWith(fetch(r).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(PAGES).then(function (c) { c.put(r, copy); }); }
      return res;
    }).catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('/offline.html'); }); }));
    return;
  }
  if (u.indexOf(self.location.origin + '/data/') === 0) {   // the search list: fresh when online
    e.respondWith(fetch(r).then(function (res) { var copy = res.clone(); caches.open(FILES).then(function (c) { c.put(r, copy); }); return res; })
      .catch(function () { return caches.match(r); }));
    return;
  }
  if (!STATIC.test(u)) return;
  e.respondWith(caches.match(r).then(function (m) {
    var net = fetch(r).then(function (res) { if (res.ok || res.type === 'opaque') { var copy = res.clone(); caches.open(FILES).then(function (c) { c.put(r, copy); }); } return res; });
    return m || net;
  }));
});

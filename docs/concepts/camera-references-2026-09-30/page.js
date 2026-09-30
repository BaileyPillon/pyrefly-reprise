// Highlights the current section in the sticky nav. The page reads fine without it.
(function () {
  var nav = document.querySelector('.nav ul');
  if (!nav || !('IntersectionObserver' in window)) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var byId = {};
  var targets = [];
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) { byId[el.id] = a; targets.push(el); }
  });
  function mark(id) {
    links.forEach(function (a) { a.removeAttribute('aria-current'); });
    var a = byId[id];
    if (!a) return;
    a.setAttribute('aria-current', 'true');
    var left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
    if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, left);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
  }, { rootMargin: '-15% 0px -75% 0px' });
  targets.forEach(function (t) { io.observe(t); });
})();

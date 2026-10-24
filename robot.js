/* Robot IA WebDesign: monta la mascota en cada <span class="rv" data-pose data-frase>,
   la hace entrar al verla, parpadear, mirar hacia el cursor y hablar al pasar o tocar. Sin dependencias. */
(function () {
  var base = window.RV_BASE || (document.currentScript && document.currentScript.src || '').replace(/robot\.js.*$/, '');
  var capas = ['brazo2', 'cuerpo'];
  function img(n) { return '<img class="rv-' + n + '" src="' + base + 'rs-' + n + '.webp" alt="" width="275" height="372" decoding="async" loading="lazy">'; }
  var GUIONES = {
    piensa: ['·', '··', '···', '?', '···', 'IA'],
    cuenta: ['2+3', '=5', '45€', '×12', '✓', 'IA'],
    baila: ['♪', '^‿^', '♫', '^‿^']
  };
  GUIONES.piensa.ritmo = 650; GUIONES.cuenta.ritmo = 600; GUIONES.baila.ritmo = 450;
  var robots = [].slice.call(document.querySelectorAll('.rv'));
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  robots.forEach(function (r, i) {
    r.setAttribute('aria-hidden', 'true');
    r.innerHTML = '<span class="rv-fig">' + capas.map(img).join('') +
      '<span class="rv-cab"><span class="rv-cab-in">' + img('cabeza') + '<span class="rv-visor"></span><i class="rv-parpado"></i></span></span>' +
      '<span class="rv-nube"><i></i><i></i><i></i></span>' +
      img('brazo') + '</span>' +
      (r.dataset.frase ? '<span class="rv-bocadillo">' + r.dataset.frase + '</span>' : '');
    // Cada robot parpadea a su ritmo
    r.style.setProperty('--parpadeo', (3.8 + (i * 0.7) % 2.4).toFixed(1) + 's');
    r.style.setProperty('--retraso', (1 + (i * 0.9) % 2).toFixed(1) + 's');
    var t;
    function habla(ms) { r.classList.add('rv-habla'); clearTimeout(t); t = setTimeout(function () { r.classList.remove('rv-habla'); }, ms || 2600); }
    r.addEventListener('mouseenter', function () { habla(2200); });
    r.addEventListener('click', function () {
      var destino = r.dataset.destino && document.querySelector(r.dataset.destino);
      if (destino) destino.click(); else habla(2600);
    });
    r._habla = habla;
    // Expresiones en la pantalla del visor
    var visor = r.querySelector('.rv-visor'), paso = 0, alegre = 0;
    function pinta() {
      if (alegre > Date.now()) { visor.textContent = '^ ^'; visor.classList.add('on'); return; }
      if (r._mira > Date.now()) {
        if (!visor.querySelector('.rv-ojo')) visor.innerHTML = '<b class="rv-ojo"></b><b class="rv-ojo"></b>';
        visor.classList.add('on'); return;
      }
      var guion = GUIONES[r.dataset.modo];
      if (!guion || !r.classList.contains('rv-dentro')) { visor.classList.remove('on'); return; }
      var v = guion[paso++ % guion.length]; visor.textContent = v; visor.classList.toggle('on', v !== 'IA');
    }
    r.addEventListener('mouseenter', function () { alegre = Date.now() + 1500; pinta(); });
    r._pinta = pinta;
    setInterval(pinta, 600);
  });

  // API para cambiar de expresión desde la página (la demo la usa para acompañar cada paso)
  window.RV = {
    pon: function (r, o) {
      if (!r) return;
      if ('modo' in o) { if (o.modo) r.dataset.modo = o.modo; else delete r.dataset.modo; }
      if (o.pose) r.dataset.pose = o.pose;
      if (o.frase) { var b = r.querySelector('.rv-bocadillo'); if (!b) { b = document.createElement('span'); b.className = 'rv-bocadillo'; r.appendChild(b); } b.textContent = o.frase; r._habla && r._habla(o.ms || 3200); }
    }
  };
  if (reducido) { robots.forEach(function (r) { r.classList.add('rv-dentro'); }); return; }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !e.target.classList.contains('rv-dentro')) {
          e.target.classList.add('rv-dentro');
          if (e.target.dataset.frase) setTimeout(function () { e.target._habla(2800); }, 1000);
        }
      });
    }, { threshold: 0.6 });
    robots.forEach(function (r) { io.observe(r); });
  } else robots.forEach(function (r) { r.classList.add('rv-dentro'); });

  // La cabeza sigue un poco al cursor (solo con ratón)
  if (matchMedia('(pointer: fine)').matches) {
    var pend = false, mx = 0, my = 0;
    addEventListener('mousemove', function (ev) {
      mx = ev.clientX; my = ev.clientY;
      if (pend) return; pend = true;
      requestAnimationFrame(function () {
        pend = false;
        robots.forEach(function (r) {
          if (!r.classList.contains('rv-dentro')) return;
          var b = r.getBoundingClientRect(); if (b.bottom < 0 || b.top > innerHeight) return;
          var cx = b.left + b.width * 0.47, cy = b.top + b.height * 0.3;
          var dx = mx - cx, dy = my - cy;
          if (r.dataset.pose === 'izquierda') dx = -dx;
          var ang = Math.max(-7, Math.min(7, Math.atan2(dy, Math.abs(dx) + 60) * 180 / Math.PI * 0.25));
          if (dx < 0) ang = -ang * 0.5;
          r.style.setProperty('--mira', ang.toFixed(1) + 'deg');
          // Ojos: se desplazan hacia el cursor dentro del visor
          var dist = Math.hypot(dx, dy) || 1;
          r.style.setProperty('--ox', (dx / dist * 3.2).toFixed(2) + 'px');
          r.style.setProperty('--oy', (dy / dist * 1.8).toFixed(2) + 'px');
          r._mira = Date.now() + 1600; r._pinta();
        });
      });
    }, { passive: true });
  }
})();

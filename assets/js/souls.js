/* Tristan Santor — Dark Souls bonfire theme */

(function () {

	var body = document.body,
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		menuButtons = Array.prototype.slice.call(document.querySelectorAll('#menu button')),
		windows = Array.prototype.slice.call(document.querySelectorAll('.window')),
		banner = document.getElementById('banner'),
		stamina = document.getElementById('stamina'),
		levelEl = document.getElementById('level'),
		mode = 'title',   // title | banner | hub | window
		index = 0,
		visited = {};

	function setMode(next) {
		mode = next;
		body.classList.toggle('is-title', next === 'title');
		body.classList.toggle('is-banner', next === 'banner');
		body.classList.toggle('is-window', next === 'window');
	}

	// ---------- Title ----------

	function start() {
		if (mode !== 'title') return;

		setMode('banner');

		if (reduceMotion) {
			enterHub();
			return;
		}

		banner.classList.remove('is-on');
		void banner.offsetWidth;
		banner.classList.add('is-on');

		setTimeout(enterHub, 2200);
	}

	function enterHub() {
		setMode('hub');
		select(index, false);
	}

	function leave() {
		history.replaceState(null, '', location.pathname + location.search);
		closeWindows();
		setMode('title');
		document.getElementById('start').focus({ preventScroll: true });
	}

	document.getElementById('title').addEventListener('click', start);

	// ---------- Menu ----------

	function select(i, tire) {
		index = (i + menuButtons.length) % menuButtons.length;

		menuButtons.forEach(function (button, n) {
			button.classList.toggle('is-selected', n === index);
		});

		menuButtons[index].focus({ preventScroll: true });

		if (tire !== false) drainStamina();
	}

	function activate(button) {
		if (button.dataset.action === 'leave') leave();
		else location.hash = button.dataset.target;
	}

	menuButtons.forEach(function (button, n) {
		button.addEventListener('mouseenter', function () { if (mode === 'hub' && n !== index) select(n); });
		button.addEventListener('focus', function () { if (n !== index) select(n, false); });
		button.addEventListener('click', function () { index = n; activate(button); });
	});

	var staminaTimer;

	function drainStamina() {
		stamina.style.width = Math.max(20, parseFloat(stamina.style.width || 100) - 14) + '%';
		clearTimeout(staminaTimer);
		staminaTimer = setTimeout(function () { stamina.style.width = '100%'; }, 700);
	}

	// ---------- Windows ----------

	function closeWindows() {
		windows.forEach(function (w) { w.hidden = true; });
	}

	function openWindow(id) {
		var target = document.getElementById(id);

		closeWindows();
		target.hidden = false;
		target.scrollTop = 0;
		setMode('window');
		target.querySelector('.close').focus({ preventScroll: true });

		menuButtons.forEach(function (button, n) {
			if (button.dataset.target === id) index = n;
		});

		if (!visited[id]) {
			visited[id] = true;
			levelUp();
		}
	}

	function route() {
		var id = location.hash.slice(1),
			isWindow = windows.some(function (w) { return w.id === id; });

		if (isWindow) {
			// Deep link straight to a section skips the title screen.
			if (mode === 'title' || mode === 'banner') setMode('hub');
			openWindow(id);
		} else if (mode === 'window') {
			closeWindows();
			enterHub();
		}
	}

	function back() {
		location.hash = '';
	}

	window.addEventListener('hashchange', route);

	windows.forEach(function (w) {
		w.querySelector('.close').addEventListener('click', function () {
			location.hash = '';
		});
	});

	// ---------- Level ----------

	function levelUp() {
		levelEl.textContent = Object.keys(visited).length + 1;
		levelEl.parentNode.classList.remove('is-up');
		void levelEl.parentNode.offsetWidth;
		levelEl.parentNode.classList.add('is-up');
	}

	// ---------- Estus ----------

	var estus = document.getElementById('estus'),
		estusCount = document.getElementById('estus-count');

	estus.addEventListener('click', function () {
		var n = parseInt(estusCount.textContent, 10);
		if (n <= 0) return;
		estusCount.textContent = n - 1;
		estus.classList.remove('is-drinking');
		void estus.offsetWidth;
		estus.classList.add('is-drinking');
	});

	// ---------- Inventory ----------

	var slots = Array.prototype.slice.call(document.querySelectorAll('.slot'));

	function selectSlot(i) {
		i = (i + slots.length) % slots.length;
		slots.forEach(function (slot, n) {
			var on = n === i;
			slot.classList.toggle('is-selected', on);
			slot.setAttribute('aria-selected', on);
			document.getElementById(slot.dataset.item).hidden = !on;
		});
		slots[i].focus({ preventScroll: true });
	}

	slots.forEach(function (slot, n) {
		slot.addEventListener('click', function () { selectSlot(n); });
	});

	function currentSlot() {
		for (var n = 0; n < slots.length; n++)
			if (slots[n].classList.contains('is-selected')) return n;
		return 0;
	}

	// ---------- Keyboard ----------

	window.addEventListener('keydown', function (e) {
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		var key = e.key;

		if (mode === 'title') {
			if (key === 'Tab' || key === 'Shift') return;
			e.preventDefault();
			start();
			return;
		}

		if (mode === 'hub') {
			if (key === 'ArrowDown' || key === 's' || key === 'S') { e.preventDefault(); select(index + 1); }
			else if (key === 'ArrowUp' || key === 'w' || key === 'W') { e.preventDefault(); select(index - 1); }
			else if (key === 'Enter' || key === ' ') { e.preventDefault(); activate(menuButtons[index]); }
			return;
		}

		if (mode === 'window') {
			if (key === 'Escape' || key === 'Backspace') { e.preventDefault(); back(); return; }

			var inInventory = !document.getElementById('projects').hidden;
			if (inInventory && (key === 'ArrowDown' || key === 'ArrowRight')) { e.preventDefault(); selectSlot(currentSlot() + 1); }
			if (inInventory && (key === 'ArrowUp' || key === 'ArrowLeft')) { e.preventDefault(); selectSlot(currentSlot() - 1); }
		}
	});

	// ---------- Embers ----------

	var canvas = document.getElementById('embers'),
		ctx = canvas.getContext('2d'),
		flames = document.getElementById('flames'),
		particles = [],
		W, H, source;

	function resize() {
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		W = window.innerWidth;
		H = window.innerHeight;
		canvas.width = W * dpr;
		canvas.height = H * dpr;
		canvas.style.width = W + 'px';
		canvas.style.height = H + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function emitter() {
		// On the title screen embers drift up from the whole bottom edge;
		// once the bonfire is lit they rise from the flames.
		if (mode === 'title') return { x: W / 2, y: H + 10, spread: W };
		var r = flames.getBoundingClientRect();
		return { x: r.left + r.width / 2, y: r.top + r.height * .55, spread: r.width * .6 };
	}

	function spawn() {
		var max = 140 + Math.random() * 200;
		particles.push({
			x: source.x + (Math.random() - .5) * source.spread,
			y: source.y,
			vx: (Math.random() - .5) * .5,
			vy: -(.5 + Math.random() * 1.5),
			r: .6 + Math.random() * 1.6,
			life: 0,
			max: mode === 'title' ? max * 2.2 : max,
			seed: Math.random() * Math.PI * 2
		});
	}

	function frame() {
		source = emitter();

		var rate = mode === 'title' ? .5 : 1.4;
		for (var s = rate; s > 0; s--) if (Math.random() < s && particles.length < 220) spawn();

		ctx.clearRect(0, 0, W, H);
		ctx.globalCompositeOperation = 'lighter';

		for (var i = particles.length - 1; i >= 0; i--) {
			var p = particles[i];
			p.life++;
			p.x += p.vx + Math.sin(p.life * .04 + p.seed) * .45;
			p.y += p.vy;

			var t = p.life / p.max;
			if (t >= 1 || p.y < -20) { particles.splice(i, 1); continue; }

			var a = (t < .1 ? t * 10 : 1 - t) * .9,
				g = Math.round(150 + 80 * (1 - t));

			ctx.fillStyle = 'rgba(255,' + g + ',60,' + a * .18 + ')';
			ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
			ctx.fillStyle = 'rgba(255,' + (g + 25) + ',120,' + a + ')';
			ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
		}

		requestAnimationFrame(frame);
	}

	window.addEventListener('resize', resize);
	resize();
	if (!reduceMotion) requestAnimationFrame(frame);

	// ---------- Init ----------

	if (location.hash) route();

})();

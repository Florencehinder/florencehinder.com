// Click-to-copy email. The address is assembled here rather than written
// in the HTML so naive spam scrapers don't find it.
(function () {
  const btn = document.querySelector(".email-copy");
  if (!btn) return;
  const note = document.querySelector(".copy-note");
  const address = ["fhinder", "gmail.com"].join("@");
  btn.textContent = address;

  let hideTimer;
  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(address).then(
      () => {
        note.textContent = "Copied ✓";
        note.classList.add("show");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => note.classList.remove("show"), 2000);
      },
      () => {
        // clipboard unavailable (very old browser) — fall back to mail app
        window.location.href = "mailto:" + address;
      }
    );
  });
})();

// Mouse wind, organic version.
// Moving the pointer doesn't push the flowers directly — it stirs up a
// soft "wind" that swells while the mouse moves and exhales slowly after.
// Each flower drifts toward the wind with its own lag and a faint flutter,
// so the motion floats rather than snaps.
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const flowers = Array.from(document.querySelectorAll(".flower-wrap")).map(
    (el, i) => ({
      el,
      angle: 0,
      wind: 0, // the wind this flower currently feels
      x: 0,
      y: 0,
      // deterministic per-flower character so they never move in unison
      response: 0.9 + Math.sin(i * 2.7) * 0.35, // how far it leans
      ease: 0.035 + (i % 4) * 0.008, // how lazily it follows
      quiverFreq: 5 + (i % 3) * 1.7, // its own flutter rhythm
      quiverPhase: i * 1.9,
    })
  );
  if (!flowers.length) return;

  function measure() {
    flowers.forEach((f) => {
      const r = f.el.getBoundingClientRect();
      f.x = r.left + r.width / 2;
      f.y = r.top + r.height * 0.25;
    });
  }
  measure();
  window.addEventListener("resize", measure);

  let gust = 0; // signed global wind, -1..1
  let mouseX = -9999;
  let mouseY = -9999;
  let lastX = null;
  let lastY = null;
  let lastT = 0;

  window.addEventListener("mousemove", (e) => {
    const now = performance.now();
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (lastX !== null) {
      const dt = Math.max(now - lastT, 8);
      const speed = Math.min(
        Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt,
        1.5
      );
      const direction = Math.sign(e.clientX - lastX) || 0;
      // breathe the wind in gently rather than kicking it
      gust += ((direction * speed) / 1.5 - gust) * 0.12;
    }
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
  });

  let prev = performance.now();
  function tick(now) {
    const dt = Math.min((now - prev) / 16.7, 3); // in ~frames
    prev = now;
    gust *= Math.pow(0.985, dt); // slow exhale once the mouse rests
    const t = now / 1000;

    flowers.forEach((f) => {
      const dist = Math.hypot(mouseX - f.x, mouseY - f.y);
      const influence = Math.max(0, 1 - dist / 500);
      // the wind reaches each flower gradually
      f.wind += (gust * influence - f.wind) * 0.06 * dt;
      const lean = f.wind * 6 * f.response;
      const flutter =
        Math.sin(t * f.quiverFreq + f.quiverPhase) * Math.abs(f.wind) * 2.2;
      const target = Math.max(-6, Math.min(6, lean + flutter));
      // float toward the target instead of springing at it
      f.angle += (target - f.angle) * f.ease * dt;
      f.el.style.transform = "rotate(" + f.angle.toFixed(3) + "deg)";
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

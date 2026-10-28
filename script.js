(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Today's date in the eyebrow ---------- */
  const today = $("#today");
  if (today) {
    today.textContent = new Date()
      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      .toUpperCase();
  }

  /* ---------- Scroll progress + nav state ---------- */
  const progress = $("#scrollProgress");
  const nav = $("#nav");
  const videoRegionEnd = $("#collections");
  const updateVideoBackdrop = () => {
    const regionEnd = Math.max(0, videoRegionEnd.getBoundingClientRect().top);
    const visibleHeight = Math.min(innerHeight, regionEnd);
    document.body.style.setProperty("--video-visible-height", `${visibleHeight}px`);
    document.body.style.setProperty("--video-fade-start", `${Math.max(0, regionEnd - 280)}px`);
    document.body.style.setProperty("--video-fade-end", `${regionEnd}px`);
  };
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    progress.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    nav.classList.toggle("scrolled", h.scrollTop > 20);
    updateVideoBackdrop();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const links = $("#navLinks");
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    links.classList.toggle("open");
  });
  $$("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("open");
      links.classList.remove("open");
    })
  );

  /* ---------- Cursor glow ---------- */
  const glow = $("#cursorGlow");
  window.addEventListener("pointermove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });

  /* ---------- Rotating headline words ---------- */
  const items = $$(".rot-item");
  if (items.length && !reduceMotion) {
    let i = 0;
    const rotator = $("#rotator");
    const fit = () => {
      rotator.style.minWidth = "0";
      rotator.style.minWidth = Math.max(...items.map((el) => el.scrollWidth)) + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    document.fonts && document.fonts.ready.then(fit);
    setInterval(() => {
      const cur = items[i];
      i = (i + 1) % items.length;
      const next = items[i];
      cur.classList.remove("active");
      cur.classList.add("leave");
      setTimeout(() => cur.classList.remove("leave"), 800);
      next.classList.add("active");
    }, 2800);
  }

  /* ---------- Scroll reveal + count-up ---------- */
  const countUp = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$("[data-count]", e.target).forEach(countUp);
        if (e.target.matches("[data-count]")) countUp(e.target);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.18 }
  );
  $$(".reveal, .steps, [data-count]").forEach((el) => io.observe(el));

  /* ---------- Photo gallery controls ---------- */
  const gallery = $("#memoryGallery");
  if (gallery) {
    $$("[data-gallery-dir]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = Number(button.dataset.galleryDir);
        gallery.scrollBy({
          left: direction * gallery.clientWidth * 0.72,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    });
  }

  /* ---------- 3D tilt + spotlight on cards ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
        card.style.setProperty("--rx", `${(0.5 - y) * 9}deg`);
        card.style.setProperty("--mx", `${x * 100}%`);
        card.style.setProperty("--my", `${y * 100}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Magnetic buttons + ripple ---------- */
  $$(".magnetic").forEach((btn) => {
    if (!reduceMotion) {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
      });
      btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
    }
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const span = document.createElement("span");
      span.className = "ripple";
      span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  });

  /* ---------- Hero mouse parallax ---------- */
  const hv = $("#heroVisual");
  if (hv && !reduceMotion) {
    const layers = $$(".float-layer", hv);
    window.addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => {
        const d = +l.dataset.depth || 10;
        l.style.transform = `translate(${-nx * d}px, ${-ny * d}px)`;
      });
    });
    window.addEventListener("scroll", () => {
      hv.style.transform = `translateY(${window.scrollY * -0.06}px)`;
    }, { passive: true });
  }

  /* ---------- Particle field ---------- */
  const canvas = $("#particles");
  const ctx = canvas.getContext("2d");
  let W, H, dots = [];
  const mouse = { x: -999, y: -999 };
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(70, Math.floor((innerWidth * innerHeight) / 20000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.4,
    }));
  };
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < dots.length; i++) {
      const p = dots[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(104,123,93,0.45)";
      ctx.fill();
      for (let j = i + 1; j < dots.length; j++) {
        const q = dots[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 120) {
          ctx.strokeStyle = `rgba(104,123,93,${(1 - d / 120) * 0.18})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (md < 160) {
        ctx.strokeStyle = `rgba(117,139,112,${(1 - md / 160) * 0.35})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  };
  if (!reduceMotion) draw();

  /* ---------- Share toggle demo ---------- */
  const toggle = $("#shareToggle");
  const card = $("#privacyCard");
  const label = $("#shareLabel");
  const status = $("#statusText");
  const privacyHint = $("#privacyHint");
  const linkText = $("#linkText");
  const randomId = () =>
    Math.random().toString(36).slice(2, 7) + "-" + Math.floor(10 + Math.random() * 90);
  toggle.addEventListener("change", () => {
    const on = toggle.checked;
    card.classList.toggle("open", on);
    label.textContent = on ? "Sharing is on" : "Sharing is off";
    status.textContent = on ? "Anyone with the link can view" : "Only you can see this vault";
    privacyHint.textContent = on
      ? "Shared preview — only people with the link can view these moments."
      : "Your photos stay private until you choose to share.";
    if (on) linkText.textContent = "vaultly.app/s/" + randomId();
  });
  $("#copyBtn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    navigator.clipboard && navigator.clipboard.writeText(linkText.textContent).catch(() => {});
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1400);
  });

})();
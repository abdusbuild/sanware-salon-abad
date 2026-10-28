/* Sanware Salon — interactions & motion */
(() => {
  const PHONE = "919525599666";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Header ---------- */
  const header = $(".site-header");
  const toTop = $(".to-top");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 30);
    toTop && toTop.classList.toggle("show", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop && toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // nav items fade in one after another, as on the reference
  $$(".nav-pill a").forEach((a, i) => { a.style.animationDelay = `${0.1 + i * 0.08}s`; });

  const menuBtn = $(".menu-btn");
  if (menuBtn) {
    const setMenu = (open) => { body.classList.toggle("menu-open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
    menuBtn.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
    $$(".mobile-nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  }

  /* ---------- Reveal on scroll ---------- */
  $$("[data-stagger]").forEach((group) => {
    const step = parseFloat(group.dataset.stagger) || 0.08;
    [...group.children].forEach((child, i) => {
      child.classList.add("reveal");
      child.style.setProperty("--d", `${0.08 + i * step}s`);
    });
  });
  const revealEls = $$(".reveal, .s-head");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -30px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Counters ---------- */
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const suf = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target.toFixed(dec) + suf; return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 1800, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 4))).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Crossfade slideshows (hero + split media) ---------- */
  $$("[data-slideshow]").forEach((wrap) => {
    const slides = $$("img", wrap);
    const dots = wrap.dataset.dots ? $$(wrap.dataset.dots + " button") : [];
    if (slides.length < 2) { slides[0] && slides[0].classList.add("on"); return; }
    let i = 0, timer;
    const show = (n) => {
      slides[i].classList.remove("on"); dots[i] && dots[i].classList.remove("on");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("on"); dots[i] && dots[i].classList.add("on");
    };
    const start = () => { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => show(i + 1), parseInt(wrap.dataset.slideshow, 10) || 5000); };
    slides[0].classList.add("on"); dots[0] && dots[0].classList.add("on");
    dots.forEach((d, n) => d.addEventListener("click", () => { show(n); start(); }));
    start();
  });

  /* ---------- Rotating word ("We provide ___ beauty services") ---------- */
  $$("[data-rotate]").forEach((el) => {
    const words = el.dataset.rotate.split("|");
    let i = 0;
    if (reduceMotion) return;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove("out"); }, 500);
    }, 2000);
  });

  /* ---------- Before / after slider ---------- */
  const ba = $(".ba");
  if (ba) {
    const before = $(".ba-before", ba);
    const after = $(".ba-after", ba);
    const knob = $(".knob", ba);
    const pauseIcon = knob.innerHTML;
    const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    let pos = 50, dir = 1, auto = !reduceMotion, dragging = false;
    const set = (p) => { pos = Math.max(0, Math.min(100, p)); ba.style.setProperty("--pos", pos + "%"); };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    const setAuto = (on) => { auto = on; knob.innerHTML = on ? pauseIcon : playIcon; knob.setAttribute("aria-label", on ? "Pause animation" : "Play animation"); };
    const loop = () => {
      if (auto && !dragging) {
        set(pos + dir * 0.25);
        if (pos >= 85 || pos <= 15) dir *= -1;
      }
      requestAnimationFrame(loop);
    };
    loop();
    knob.addEventListener("click", (e) => { e.stopPropagation(); setAuto(!auto); });
    ba.addEventListener("pointerdown", (e) => { if (e.target.closest(".knob")) return; dragging = true; setAuto(false); fromEvent(e); ba.setPointerCapture(e.pointerId); });
    ba.addEventListener("pointermove", (e) => { if (dragging) fromEvent(e); });
    ba.addEventListener("pointerup", () => { dragging = false; });
    ba.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { setAuto(false); set(pos - 5); }
      if (e.key === "ArrowRight") { setAuto(false); set(pos + 5); }
    });
    $$(".ba-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        $$(".ba-pill").forEach((p) => { p.classList.remove("active"); p.setAttribute("aria-pressed", "false"); });
        pill.classList.add("active");
        pill.setAttribute("aria-pressed", "true");
        before.style.opacity = after.style.opacity = 0;
        setTimeout(() => {
          before.src = pill.dataset.before;
          after.src = pill.dataset.after;
          before.alt = `Before: ${pill.textContent}`;
          after.alt = `After: ${pill.textContent}`;
          before.style.opacity = after.style.opacity = 1;
          set(50); setAuto(!reduceMotion);
        }, 300);
      });
    });
    set(50);
  }

  /* ---------- Carousels (why-choose-us, testimonials) ---------- */
  $$(".carousel").forEach((car) => {
    const track = $(".track", car);
    const step = () => (track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 24 : 300);
    const go = (d) => {
      const max = track.scrollWidth - track.clientWidth - 4;
      if (d > 0 && track.scrollLeft >= max) track.scrollTo({ left: 0 });
      else if (d < 0 && track.scrollLeft <= 0) track.scrollTo({ left: max });
      else track.scrollBy({ left: d * step() });
    };
    $(".prev", car) && $(".prev", car).addEventListener("click", () => go(-1));
    $(".next", car) && $(".next", car).addEventListener("click", () => go(1));
    if (car.dataset.autoplay && !reduceMotion) {
      let t = setInterval(() => go(1), parseInt(car.dataset.autoplay, 10));
      car.addEventListener("mouseenter", () => clearInterval(t));
      car.addEventListener("mouseleave", () => { clearInterval(t); t = setInterval(() => go(1), parseInt(car.dataset.autoplay, 10)); });
    }
  });

  /* ---------- Process stepper ---------- */
  const stepper = $("[data-stepper]");
  if (stepper) {
    const steps = JSON.parse($("#steps-data").textContent);
    const panel = $(".step-body", stepper);
    const listBtns = $$(".step-list button", stepper);
    const dots = $$(".stepper-line button");
    const fill = $(".stepper-line .fill");
    const prev = $(".step-prev", stepper);
    const next = $(".step-next", stepper);
    let cur = 0;
    const render = (n) => {
      cur = Math.max(0, Math.min(steps.length - 1, n));
      const s = steps[cur];
      panel.innerHTML = `
        <div class="head">${s.icon}<div><div class="k">Step ${cur + 1}</div><h3>${s.title}</h3></div></div>
        <p class="desc">${s.desc}</p>
        <div class="step-points">${s.points.map((p, i) => `<div style="animation-delay:${0.1 + i * 0.08}s">${p}</div>`).join("")}</div>`;
      panel.style.animation = "none"; void panel.offsetWidth; panel.style.animation = "";
      listBtns.forEach((b, i) => b.classList.toggle("on", i === cur));
      dots.forEach((b, i) => { b.classList.toggle("on", i === cur); b.classList.toggle("done", i < cur); });
      if (fill) fill.style.width = `calc((100% - 40px) * ${cur / (steps.length - 1)})`;
      prev.disabled = cur === 0;
      next.disabled = cur === steps.length - 1;
    };
    listBtns.forEach((b, i) => b.addEventListener("click", () => render(i)));
    dots.forEach((b, i) => b.addEventListener("click", () => render(i)));
    prev.addEventListener("click", () => render(cur - 1));
    next.addEventListener("click", () => render(cur + 1));
    render(0);
  }

  /* ---------- Filters (gallery + FAQ) ---------- */
  $$("[data-filter-group]").forEach((group) => {
    const target = $(group.dataset.filterGroup);
    const btns = $$("[data-filter]", group);
    btns.forEach((btn) => btn.addEventListener("click", () => {
      btns.forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      const f = btn.dataset.filter;
      $$("[data-cat]", target).forEach((item) => {
        const show = f === "all" || item.dataset.cat === f;
        item.classList.toggle("hide", !show);
        if (show) { item.classList.remove("in"); requestAnimationFrame(() => requestAnimationFrame(() => item.classList.add("in"))); }
      });
    }));
  });

  /* ---------- FAQ accordion ---------- */
  $$(".faq-q").forEach((q) => q.addEventListener("click", () => {
    const item = q.closest(".faq-item");
    const open = !item.classList.contains("open");
    $$(".faq-item.open").forEach((o) => { if (o !== item) { o.classList.remove("open"); $(".faq-q", o).setAttribute("aria-expanded", "false"); } });
    item.classList.toggle("open", open);
    q.setAttribute("aria-expanded", String(open));
  }));

  /* ---------- Lightbox ---------- */
  if ($("[data-lightbox]")) {
    const items = () => $$("[data-lightbox]").filter((el) => !el.classList.contains("hide"));
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML = '<img alt=""><button class="lb-btn lb-close" aria-label="Close">✕</button><button class="lb-btn lb-prev" aria-label="Previous">‹</button><button class="lb-btn lb-next" aria-label="Next">›</button><div class="lb-count"></div>';
    body.appendChild(lb);
    const img = $("img", lb);
    let idx = 0;
    const show = (n) => {
      const list = items();
      idx = (n + list.length) % list.length;
      img.src = list[idx].getAttribute("href");
      img.alt = $("img", list[idx])?.alt || "";
      $(".lb-count", lb).textContent = `${idx + 1} / ${list.length}`;
    };
    const close = () => { lb.classList.remove("open"); body.style.overflow = ""; };
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-lightbox]");
      if (!t) return;
      e.preventDefault();
      show(items().indexOf(t));
      lb.classList.add("open");
      body.style.overflow = "hidden";
    });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
    $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Inquiry popup (shown once per session, like the reference) ---------- */
  const modal = $(".modal");
  if (modal) {
    const open = () => { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); setTimeout(() => $("input", modal)?.focus({ preventScroll: true }), 400); };
    const close = () => { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); };
    $(".modal-close", modal).addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
    $$("[data-open-modal]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(); }));
    let seen = false;
    try { seen = sessionStorage.getItem("sanware-popup") === "1"; } catch (e) {}
    if (!seen && body.dataset.popup !== "off") {
      setTimeout(() => {
        open();
        try { sessionStorage.setItem("sanware-popup", "1"); } catch (e) {}
      }, 2500);
    }
  }

  /* ---------- Opening hours: highlight today ---------- */
  const today = new Date().getDay();
  $$(".hours tr[data-day]").forEach((tr) => { if (Number(tr.dataset.day) === today) tr.classList.add("today"); });

  /* ---------- Forms → WhatsApp ---------- */
  $$("form[data-whatsapp]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form);
      const lines = [
        "Hello Sanware Salon! I'd like to book an appointment.",
        `Name: ${d.get("name")}`,
        d.get("phone") ? `Phone: ${d.get("phone")}` : "",
        d.get("service") ? `Service: ${d.get("service")}` : "",
        d.get("date") ? `Preferred date: ${d.get("date")}` : "",
        d.get("message") ? `Message: ${d.get("message")}` : "",
      ].filter(Boolean);
      window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
      form.closest(".modal") && form.closest(".modal").classList.remove("open");
    });
  });

  /* ---------- Floating "Enquire" panel ---------- */
  const enqBtn = $("#enquireToggle");
  const enqPanel = $("#enquirePanel");
  if (enqBtn && enqPanel) {
    const setEnq = (open) => {
      enqPanel.hidden = !open;
      enqBtn.classList.toggle("is-open", open);
      enqBtn.setAttribute("aria-expanded", String(open));
    };
    enqBtn.addEventListener("click", (e) => { e.stopPropagation(); setEnq(enqPanel.hidden); });
    $("#enquireClose").addEventListener("click", () => { setEnq(false); enqBtn.focus(); });
    document.addEventListener("click", (e) => { if (!enqPanel.hidden && !enqPanel.contains(e.target)) setEnq(false); });
    document.addEventListener("keydown", (e) => e.key === "Escape" && setEnq(false));
  }

  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();

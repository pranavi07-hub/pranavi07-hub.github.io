(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Theme toggle ----
  var root = document.documentElement;
  var themeToggle = document.getElementById("theme-toggle");
  var STORAGE_KEY = "pg-theme";

  function applyStoredTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }
  }

  function currentIsDark() {
    var attr = root.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  themeToggle.addEventListener("click", function () {
    var next = currentIsDark() ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  });

  applyStoredTheme();

  // ---- Mobile nav ----
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");

  navToggle.addEventListener("click", function () {
    var isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  var navLinks = Array.prototype.slice.call(mainNav.querySelectorAll("a[data-nav]"));
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // ---- Scroll reveal (with stagger) ----
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var siblingCounters = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var count = siblingCounters.get(parent) || 0;
      el.style.transitionDelay = Math.min(count * 60, 300) + "ms";
      siblingCounters.set(parent, count + 1);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // ---- Custom smooth anchor scroll ----
  var headerEl = document.getElementById("header");
  function smoothScrollTo(targetY, duration) {
    var startY = window.pageYOffset;
    var distance = targetY - startY;
    if (prefersReducedMotion || duration <= 0) {
      window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
      return;
    }
    var startTime = Date.now();
    var timer = setInterval(function () {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      window.scrollTo({ top: startY + distance * eased, left: 0, behavior: "auto" });
      if (progress >= 1) clearInterval(timer);
    }, 16);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (!hash || hash.length < 2) return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      var headerHeight = headerEl ? headerEl.offsetHeight : 0;
      var targetY = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
      smoothScrollTo(Math.max(targetY, 0), 650);
      history.pushState(null, "", hash);
    });
  });

  // ---- Scroll progress bar ----
  var progressBar = document.getElementById("scroll-progress");
  function updateProgress() {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var scrollHeight = doc.scrollHeight - doc.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // ---- Nav scroll-spy ----
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href").replace("#", "");
      return document.getElementById(id);
    })
    .filter(Boolean);

  function updateActiveNav() {
    var scrollPos = window.scrollY + 120;
    var currentId = null;
    var bestTop = -Infinity;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      if (top <= scrollPos && top > bestTop) {
        bestTop = top;
        currentId = section.id;
      }
    });
    navLinks.forEach(function (link) {
      var id = link.getAttribute("href").replace("#", "");
      link.classList.toggle("active", id === currentId);
    });
  }
  document.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  // ---- Tilt cards ----
  if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--ry", (px * 6).toFixed(2) + "deg");
        el.style.setProperty("--rx", (py * -6).toFixed(2) + "deg");
      });
      el.addEventListener("mouseleave", function () {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  // ---- Role cycler ----
  var roleTextEl = document.getElementById("role-text");
  var roles = ["SOFTWARE ENGINEER", "FULL-STACK DEVELOPER", "PROBLEMS SOLVER"];

  if (roleTextEl) {
    if (prefersReducedMotion) {
      roleTextEl.textContent = roles[0];
    } else {
      var roleIdx = 0;
      var typeSpeed = 55;
      var eraseSpeed = 30;
      var holdTime = 1500;

      function typeRole() {
        var word = roles[roleIdx];
        var i = 0;
        roleTextEl.textContent = "";
        var typeInterval = setInterval(function () {
          i++;
          roleTextEl.textContent = word.slice(0, i);
          if (i >= word.length) {
            clearInterval(typeInterval);
            setTimeout(eraseRole, holdTime);
          }
        }, typeSpeed);
      }

      function eraseRole() {
        var word = roleTextEl.textContent;
        var eraseInterval = setInterval(function () {
          word = word.slice(0, -1);
          roleTextEl.textContent = word;
          if (word.length === 0) {
            clearInterval(eraseInterval);
            roleIdx = (roleIdx + 1) % roles.length;
            typeRole();
          }
        }, eraseSpeed);
      }

      typeRole();
    }
  }

  // ---- Animated stat counters ----
  var statEls = document.querySelectorAll(".stat-num");
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (prefersReducedMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    var duration = 1200;
    var startTime = Date.now();
    var timer = setInterval(function () {
      var progress = Math.min((Date.now() - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (progress >= 1) clearInterval(timer);
    }, 16);
  }

  if ("IntersectionObserver" in window) {
    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statEls.forEach(function (el) { statObserver.observe(el); });
  } else {
    statEls.forEach(animateCount);
  }

  // ---- Hero photo tilt ----
  var heroPhoto = document.getElementById("hero-photo");
  if (heroPhoto && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    heroPhoto.addEventListener("mousemove", function (e) {
      var rect = heroPhoto.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      heroPhoto.style.setProperty("--rx", (py * -6).toFixed(2) + "deg");
      heroPhoto.style.setProperty("--ry", (px * 6).toFixed(2) + "deg");
    });
    heroPhoto.addEventListener("mouseleave", function () {
      heroPhoto.style.setProperty("--rx", "0deg");
      heroPhoto.style.setProperty("--ry", "0deg");
    });
    heroPhoto.classList.add("tilt");
  }

  // ---- Project carousel ----
  var track = document.getElementById("carousel-track");
  if (track) {
    var slides = Array.prototype.slice.call(track.querySelectorAll(".carousel-slide"));
    var dotsWrap = document.getElementById("carousel-dots");
    var prevBtn = document.getElementById("carousel-prev");
    var nextBtn = document.getElementById("carousel-next");
    var current = 0;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Go to project " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll(".dot"));

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dots.forEach(function (d, i) { d.classList.toggle("active", i === current); });
    }

    prevBtn.addEventListener("click", function () { goTo(current - 1); });
    nextBtn.addEventListener("click", function () { goTo(current + 1); });

    if (!prefersReducedMotion) {
      var autoTimer = setInterval(function () { goTo(current + 1); }, 6000);
      track.closest(".carousel").addEventListener("mouseenter", function () { clearInterval(autoTimer); });
    }
  }

  // ---- Confetti burst (monochrome) ----
  var confettiCanvas = document.getElementById("confetti-canvas");
  if (confettiCanvas) {
    var ctx = confettiCanvas.getContext("2d");
    var particles = [];
    var animId = null;

    function confettiColor() {
      var isDark = currentIsDark();
      return isDark ? "#F5F5F5" : "#0A0A0A";
    }

    function resizeCanvas() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function spawnConfetti(x, y) {
      var count = prefersReducedMotion ? 0 : 24;
      var color = confettiColor();
      for (var i = 0; i < count; i++) {
        var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        var speed = 3 + Math.random() * 5;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 4 + Math.random() * 4,
          color: color,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          life: 1
        });
      }
      if (!animId && particles.length) animId = requestAnimationFrame(tick);
    }

    function tick() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      particles.forEach(function (p) {
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= 0.012;
      });
      particles = particles.filter(function (p) { return p.life > 0; });
      particles.forEach(function (p) {
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (particles.length) {
        animId = requestAnimationFrame(tick);
      } else {
        animId = null;
      }
    }

    document.querySelectorAll("[data-confetti]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        spawnConfetti(e.clientX, e.clientY);
      });
    });
  }
})();

(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileNav = window.matchMedia("(max-width: 960px)");

  /* ------------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------------ */

  var themeToggle = doc.getElementById("theme-toggle");
  var themeMeta = doc.getElementById("theme-color");
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      return window.localStorage.getItem("hnt-theme");
    } catch (error) {
      return null;
    }
  }

  function syncThemeUI(theme) {
    if (!themeToggle) return;

    var isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "切换浅色模式" : "切换深色模式");

    if (themeMeta) {
      themeMeta.setAttribute("content", isDark ? "#13120f" : "#f4f0e8");
    }
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    syncThemeUI(theme);

    if (persist) {
      try {
        window.localStorage.setItem("hnt-theme", theme);
      } catch (error) {
        /* Storage may be unavailable in private contexts. */
      }
    }
  }

  syncThemeUI(root.dataset.theme || "light");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  function handleSystemThemeChange(event) {
    if (!storedTheme()) {
      applyTheme(event.matches ? "dark" : "light", false);
    }
  }

  if (typeof systemDark.addEventListener === "function") {
    systemDark.addEventListener("change", handleSystemThemeChange);
  } else if (typeof systemDark.addListener === "function") {
    systemDark.addListener(handleSystemThemeChange);
  }

  /* ------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------ */

  var menuToggle = doc.getElementById("menu-toggle");
  var nav = doc.getElementById("site-nav");
  var navBackdrop = doc.getElementById("nav-backdrop");
  var menuOpen = false;

  function setMenu(open, restoreFocus) {
    if (open && !mobileNav.matches) return;

    menuOpen = open;
    doc.body.classList.toggle("nav-open", open);

    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    }

    if (nav && mobileNav.matches) {
      nav.inert = !open;
      if (open) {
        nav.removeAttribute("aria-hidden");
      } else {
        nav.setAttribute("aria-hidden", "true");
      }
    }

    if (open && nav) {
      window.setTimeout(function () {
        var firstLink = nav.querySelector("a[href]");
        if (firstLink) firstLink.focus();
      }, 80);
    }

    if (!open && restoreFocus && menuToggle) {
      menuToggle.focus();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(!menuOpen, false);
    });
  }

  if (navBackdrop) {
    navBackdrop.addEventListener("click", function () {
      setMenu(false, true);
    });
  }

  if (nav) {
    nav.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function () {
        if (menuOpen) {
          setMenu(false, false);
          if (menuToggle) menuToggle.focus({ preventScroll: true });
        }
      });
    });
  }

  doc.addEventListener("keydown", function (event) {
    if (!menuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false, true);
      return;
    }

    if (event.key !== "Tab" || !nav) return;

    var focusable = Array.prototype.slice.call(
      doc.querySelectorAll(".site-header a[href], .site-header button")
    );
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function syncNavigationMode() {
    if (!nav) return;

    if (!mobileNav.matches) {
      menuOpen = false;
      doc.body.classList.remove("nav-open");
      nav.inert = false;
      nav.removeAttribute("aria-hidden");
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "打开菜单");
      }
      return;
    }

    if (!menuOpen) {
      nav.inert = true;
      nav.setAttribute("aria-hidden", "true");
    }
  }

  syncNavigationMode();

  if (typeof mobileNav.addEventListener === "function") {
    mobileNav.addEventListener("change", syncNavigationMode);
  } else if (typeof mobileNav.addListener === "function") {
    mobileNav.addListener(syncNavigationMode);
  }

  /* ------------------------------------------------------------------------
     Project filters
     ------------------------------------------------------------------------ */

  var filterButtons = Array.prototype.slice.call(doc.querySelectorAll(".filter"));
  var projectCards = Array.prototype.slice.call(doc.querySelectorAll(".project-card"));
  var filterStatus = doc.getElementById("filter-status");
  var headingCount = doc.querySelector(".heading-count");

  if (headingCount && projectCards.length) {
    headingCount.textContent = String(projectCards.length).padStart(2, "0");
  }

  filterButtons.forEach(function (button) {
    var filter = button.dataset.filter;
    var count =
      filter === "all"
        ? projectCards.length
        : projectCards.filter(function (card) {
            return card.dataset.category === filter;
          }).length;
    var countNode = button.querySelector("span");

    if (countNode) countNode.textContent = String(count).padStart(2, "0");
  });

  function applyFilter(filter) {
    var shown = 0;

    projectCards.forEach(function (card) {
      var isMatch = filter === "all" || card.dataset.category === filter;
      card.hidden = !isMatch;

      if (isMatch) {
        shown += 1;
        card.classList.add("is-visible");
      }
    });

    filterButtons.forEach(function (button) {
      var active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (filterStatus) {
      filterStatus.textContent = "已显示 " + shown + " 个项目";
    }

    if (!reduceMotion) {
      projectCards
        .filter(function (card) {
          return !card.hidden;
        })
        .forEach(function (card, index) {
          if (typeof card.animate !== "function") return;

          card.animate(
            [
              { opacity: 0 },
              { opacity: 1 }
            ],
            {
              duration: 420,
              delay: Math.min(index, 5) * 38,
              easing: "ease-out",
              fill: "backwards"
            }
          );
        });
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.dataset.filter || "all");
    });
  });

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */

  var revealItems = Array.prototype.slice.call(doc.querySelectorAll("[data-reveal]"));

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -7% 0px",
        threshold: 0.1
      }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  /* ------------------------------------------------------------------------
     Header state + active navigation
     ------------------------------------------------------------------------ */

  var header = doc.getElementById("site-header");
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll(".site-nav > a"));
  var navSections = navLinks
    .map(function (link) {
      var href = link.getAttribute("href") || "";
      var id = href.charAt(0) === "#" ? href.slice(1) : "";
      return {
        link: link,
        section: id ? doc.getElementById(id) : null
      };
    })
    .filter(function (item) {
      return item.section;
    });

  var scrollTicking = false;

  function updateScrollState() {
    var scrollY = window.scrollY || window.pageYOffset;

    if (header) {
      header.classList.toggle("is-scrolled", scrollY > 12);
    }

    var probe = scrollY + window.innerHeight * 0.36;
    var currentId = "";

    navSections.forEach(function (item) {
      var top = item.section.getBoundingClientRect().top + scrollY;
      if (top <= probe) currentId = item.section.id;
    });

    navSections.forEach(function (item) {
      if (item.section.id === currentId) {
        item.link.setAttribute("aria-current", "true");
      } else {
        item.link.removeAttribute("aria-current");
      }
    });

    scrollTicking = false;
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollState);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScrollState();

  /* ------------------------------------------------------------------------
     Pointer spotlight on project cards
     ------------------------------------------------------------------------ */

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (finePointer.matches) {
    projectCards.forEach(function (card) {
      card.addEventListener("pointermove", function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", event.clientX - rect.left + "px");
        card.style.setProperty("--my", event.clientY - rect.top + "px");
      });
    });
  }

  /* ------------------------------------------------------------------------
     Local time + year
     ------------------------------------------------------------------------ */

  var timeNode = doc.getElementById("local-time");
  var yearNode = doc.getElementById("year");

  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }

  if (timeNode) {
    var timeFormatter;

    try {
      timeFormatter = new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (error) {
      timeFormatter = new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }

    function updateClock() {
      timeNode.textContent = timeFormatter.format(new Date());
    }

    updateClock();
    window.setInterval(updateClock, 30000);
  }
})();

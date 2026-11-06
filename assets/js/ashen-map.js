(function () {
  "use strict";

  var maps = Array.isArray(window.ASHEN_MAPS) ? window.ASHEN_MAPS : [];
  if (!maps.length) return;

  var MAP_BASE = "../common/post/灰烬誓约/maps/";
  var THUMB_BASE = MAP_BASE + "thumbs/";

  var els = {
    canvas: document.getElementById("map-canvas"),
    image: document.getElementById("map-image"),
    list: document.getElementById("map-list"),
    rail: document.getElementById("map-rail"),
    title: document.getElementById("map-title"),
    group: document.getElementById("map-group"),
    size: document.getElementById("map-size"),
    code: document.getElementById("map-current-code"),
    counter: document.getElementById("map-counter"),
    stageName: document.getElementById("map-stage-name"),
    original: document.getElementById("map-original"),
    zoom: document.getElementById("map-zoom"),
    zoomIn: document.getElementById("map-zoom-in"),
    zoomOut: document.getElementById("map-zoom-out"),
    reset: document.getElementById("map-reset"),
    prev: document.getElementById("map-prev"),
    next: document.getElementById("map-next")
  };

  var state = {
    index: 0,
    baseScale: 1,
    zoom: 1,
    x: 0,
    y: 0,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    loadToken: 0
  };

  var activeButton = null;
  var resizeTimer = null;

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function imagePath(map) {
    return MAP_BASE + map.id + ".png";
  }

  function thumbPath(map) {
    // map34 is intentionally replaceable as a single full-size file.
    return map.id === "map34" ? imagePath(map) : THUMB_BASE + map.id + ".webp";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildRail() {
    var groups = [];
    var groupMap = {};

    maps.forEach(function (map, index) {
      if (!groupMap[map.group]) {
        groupMap[map.group] = {
          name: map.group,
          items: []
        };
        groups.push(groupMap[map.group]);
      }
      groupMap[map.group].items.push({ map: map, index: index });
    });

    groups.forEach(function (group) {
      var section = document.createElement("section");
      section.className = "map-group";

      var heading = document.createElement("h2");
      heading.textContent = group.name;
      section.appendChild(heading);

      var list = document.createElement("div");
      list.className = "map-items";

      group.items.forEach(function (item) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "map-item";
        button.dataset.index = String(item.index);
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", item.map.code + "，" + item.map.name);

        var thumb = document.createElement("span");
        thumb.className = "map-item-thumb";
        var thumbImage = document.createElement("img");
        thumbImage.src = thumbPath(item.map);
        thumbImage.alt = "";
        thumbImage.loading = "lazy";
        thumbImage.decoding = "async";
        thumb.appendChild(thumbImage);

        var text = document.createElement("span");
        text.className = "map-item-text";
        var code = document.createElement("span");
        code.className = "map-item-code";
        code.textContent = item.map.code;
        var name = document.createElement("span");
        name.className = "map-item-name";
        name.textContent = item.map.name;
        text.appendChild(code);
        text.appendChild(name);

        button.appendChild(thumb);
        button.appendChild(text);
        button.addEventListener("click", function () {
          selectMap(item.index, { updateUrl: true, scrollRail: false });
        });
        list.appendChild(button);
      });

      section.appendChild(list);
      els.list.appendChild(section);
    });
  }

  function initialIndex() {
    var raw = new URLSearchParams(window.location.search).get("map") || "";
    var match = /^(?:map)?(\d{1,2})$/i.exec(raw.trim());
    if (!match) return 0;

    var id = "map" + pad(Number(match[1]));
    for (var i = 0; i < maps.length; i += 1) {
      if (maps[i].id === id) return i;
    }
    return 0;
  }

  function updateUrl(map) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("map", map.code);
      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      /* Keep the browser usable when history is restricted by the host. */
    }
  }

  function setActiveButton(index) {
    if (activeButton) {
      activeButton.classList.remove("is-active");
      activeButton.setAttribute("aria-pressed", "false");
    }

    activeButton = els.list.querySelector('.map-item[data-index="' + index + '"]');

    if (activeButton) {
      activeButton.classList.add("is-active");
      activeButton.setAttribute("aria-pressed", "true");
    }
  }

  function scrollActiveIntoView() {
    if (!activeButton || window.innerWidth <= 980) return;

    var railRect = els.rail.getBoundingClientRect();
    var buttonRect = activeButton.getBoundingClientRect();

    if (buttonRect.top < railRect.top + 44) {
      els.rail.scrollTop -= railRect.top + 44 - buttonRect.top;
    } else if (buttonRect.bottom > railRect.bottom - 34) {
      els.rail.scrollTop += buttonRect.bottom - (railRect.bottom - 34);
    }
  }

  function applyTransform() {
    if (!els.image.offsetWidth) return;

    var canvasWidth = els.canvas.clientWidth;
    var canvasHeight = els.canvas.clientHeight;
    var imageWidth = els.image.offsetWidth * state.zoom;
    var imageHeight = els.image.offsetHeight * state.zoom;
    var maxX = Math.max(0, (imageWidth - canvasWidth) / 2);
    var maxY = Math.max(0, (imageHeight - canvasHeight) / 2);

    state.x = clamp(state.x, -maxX, maxX);
    state.y = clamp(state.y, -maxY, maxY);

    els.image.style.transform =
      "translate3d(" + state.x + "px, " + state.y + "px, 0) scale(" + state.zoom + ")";
    els.canvas.classList.toggle("is-zoomed", state.zoom > 1);
    els.zoom.textContent = Math.round(state.zoom * 100) + "%";
  }

  function fitMap() {
    var imageWidth = els.image.naturalWidth;
    var imageHeight = els.image.naturalHeight;
    var canvasWidth = els.canvas.clientWidth;
    var canvasHeight = els.canvas.clientHeight;

    if (!imageWidth || !imageHeight || !canvasWidth || !canvasHeight) return;

    var baseScale = Math.min(
      (canvasWidth * 0.92) / imageWidth,
      (canvasHeight * 0.84) / imageHeight,
      1.7
    );
    baseScale = Math.max(baseScale, 0.08);

    state.baseScale = baseScale;
    state.zoom = 1;
    state.x = 0;
    state.y = 0;

    els.image.style.width = Math.round(imageWidth * baseScale) + "px";
    els.image.style.height = Math.round(imageHeight * baseScale) + "px";
    applyTransform();
  }

  function updateDetails(map, index) {
    els.title.textContent = map.name;
    els.group.textContent = map.group;
    els.code.textContent = map.code;
    els.stageName.textContent = map.name;
    els.counter.textContent = pad(index + 1) + " / " + maps.length;
    els.size.textContent = map.width + " × " + map.height;
    els.original.href = imagePath(map);
  }

  function selectMap(index, options) {
    options = options || {};
    index = ((index % maps.length) + maps.length) % maps.length;

    var map = maps[index];
    var token = ++state.loadToken;

    state.index = index;
    state.zoom = 1;
    state.x = 0;
    state.y = 0;
    updateDetails(map, index);
    setActiveButton(index);

    els.image.classList.remove("is-loaded");
    els.image.width = map.width;
    els.image.height = map.height;
    els.image.alt = map.name + "，" + map.group + " 地图";

    els.image.onload = function () {
      if (token !== state.loadToken) return;
      els.image.classList.add("is-loaded");
      els.size.textContent = els.image.naturalWidth + " × " + els.image.naturalHeight;
      window.requestAnimationFrame(fitMap);
    };

    els.image.src = imagePath(map);

    if (els.image.complete && els.image.naturalWidth) {
      els.image.classList.add("is-loaded");
      window.requestAnimationFrame(fitMap);
    }

    if (options.updateUrl !== false) updateUrl(map);
    if (options.scrollRail) window.requestAnimationFrame(scrollActiveIntoView);
  }

  function zoomBy(factor) {
    state.zoom = clamp(state.zoom * factor, 1, 4);
    applyTransform();
  }

  function resetZoom() {
    state.zoom = 1;
    state.x = 0;
    state.y = 0;
    applyTransform();
  }

  function showPrevious() {
    selectMap(state.index - 1, { updateUrl: true, scrollRail: true });
  }

  function showNext() {
    selectMap(state.index + 1, { updateUrl: true, scrollRail: true });
  }

  function endDrag(event) {
    if (!state.dragging) return;
    state.dragging = false;
    state.pointerId = null;
    els.canvas.classList.remove("is-dragging");

    if (event && els.canvas.hasPointerCapture && els.canvas.hasPointerCapture(event.pointerId)) {
      els.canvas.releasePointerCapture(event.pointerId);
    }
  }

  els.canvas.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startTx = state.x;
    state.startTy = state.y;
    els.canvas.classList.add("is-dragging");
    els.canvas.setPointerCapture(event.pointerId);
  });

  els.canvas.addEventListener("pointermove", function (event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;

    state.x = state.startTx + event.clientX - state.startX;
    state.y = state.startTy + event.clientY - state.startY;
    applyTransform();
  });

  els.canvas.addEventListener("pointerup", endDrag);
  els.canvas.addEventListener("pointercancel", endDrag);

  els.canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, { passive: false });

  els.canvas.addEventListener("dblclick", resetZoom);

  els.canvas.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1.2);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomBy(1 / 1.2);
    } else if (event.key === "0") {
      event.preventDefault();
      resetZoom();
    }
  });

  els.zoomIn.addEventListener("click", function () {
    zoomBy(1.2);
  });

  els.zoomOut.addEventListener("click", function () {
    zoomBy(1 / 1.2);
  });

  els.reset.addEventListener("click", resetZoom);
  els.prev.addEventListener("click", showPrevious);
  els.next.addEventListener("click", showNext);

  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fitMap, 150);
  });

  buildRail();
  var startIndex = initialIndex();
  selectMap(startIndex, { updateUrl: startIndex > 0, scrollRail: true });
})();

(function () {
  "use strict";

  var dialog = document.getElementById("guide-lightbox");
  if (!dialog) return;

  var image = dialog.querySelector("img");
  var closeButton = dialog.querySelector(".guide-lightbox__close");
  var lastFocused = null;

  function openLightbox(sourceImage) {
    lastFocused = sourceImage;
    image.src = sourceImage.currentSrc || sourceImage.src;
    image.alt = sourceImage.alt || "";

    if (typeof dialog.showModal === "function") {
      document.body.classList.add("lightbox-open");
      dialog.showModal();
      closeButton.focus();
    } else {
      window.open(sourceImage.src, "_blank", "noopener");
    }
  }

  function closeLightbox() {
    if (dialog.open) dialog.close();
    document.body.classList.remove("lightbox-open");
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll("[data-zoom]").forEach(function (sourceImage) {
    sourceImage.setAttribute("tabindex", "0");
    sourceImage.setAttribute("role", "button");

    sourceImage.addEventListener("click", function () {
      openLightbox(sourceImage);
    });

    sourceImage.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(sourceImage);
      }
    });
  });

  closeButton.addEventListener("click", closeLightbox);

  dialog.addEventListener("close", function () {
    document.body.classList.remove("lightbox-open");
    if (lastFocused) lastFocused.focus();
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeLightbox();
  });
})();

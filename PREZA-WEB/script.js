(() => {
  "use strict";

  document.body.classList.remove("no-js");

  const slides = [...document.querySelectorAll(".slide")];
  const previousButton = document.querySelector("#prevButton");
  const nextButton = document.querySelector("#nextButton");
  const hideButton = document.querySelector("#hideButton");
  const progressBar = document.querySelector("#progressBar");
  const currentNumber = document.querySelector("#currentNumber");
  const currentTitle = document.querySelector("#currentTitle");
  let currentIndex = readIndexFromHash();
  let touchStartX = null;
  let touchStartY = null;

  function readIndexFromHash() {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (!match) return 0;
    return Math.min(slides.length - 1, Math.max(0, Number(match[1]) - 1));
  }

  function render({ updateHash = true } = {}) {
    slides.forEach((slide, index) => {
      const active = index === currentIndex;
      slide.classList.toggle("is-active", active);
      slide.classList.toggle("is-before", index < currentIndex);
      slide.setAttribute("aria-hidden", String(!active));
      if (active) slide.removeAttribute("inert");
      else slide.setAttribute("inert", "");
    });

    document.body.classList.toggle(
      "on-dark-slide",
      Boolean(slides[currentIndex].querySelector(".slide-frame--dark")),
    );

    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === slides.length - 1;
    progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
    currentNumber.textContent = String(currentIndex + 1).padStart(2, "0");
    currentTitle.textContent = slides[currentIndex].dataset.title || "";
    document.title = `${slides[currentIndex].dataset.title} — Fabriq`;

    if (updateHash) {
      history.replaceState(null, "", `#slide-${currentIndex + 1}`);
    }
  }

  function goTo(index) {
    const nextIndex = Math.min(slides.length - 1, Math.max(0, index));
    if (nextIndex === currentIndex) return;
    currentIndex = nextIndex;
    render();
  }

  function toggleControls(force) {
    const hidden = typeof force === "boolean" ? force : !document.body.classList.contains("controls-hidden");
    document.body.classList.toggle("controls-hidden", hidden);
    hideButton.setAttribute("aria-pressed", String(hidden));
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be unavailable for local files or browser policy; navigation remains usable.
    }
  }

  previousButton.addEventListener("click", () => goTo(currentIndex - 1));
  nextButton.addEventListener("click", () => goTo(currentIndex + 1));
  hideButton.addEventListener("click", () => toggleControls(true));

  window.addEventListener("hashchange", () => {
    currentIndex = readIndexFromHash();
    render({ updateHash: false });
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;

    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      goTo(currentIndex + 1);
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      goTo(currentIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(slides.length - 1);
    } else if (event.key.toLowerCase() === "h") {
      event.preventDefault();
      toggleControls();
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      void toggleFullscreen();
    }
  });

  window.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  window.addEventListener("touchend", (event) => {
    if (touchStartX === null || touchStartY === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(deltaX) < 55 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    goTo(currentIndex + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  render();
})();

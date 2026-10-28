(() => {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll("[data-theme-toggle]")];
  const storageKey = "vaultly-theme";

  const updateButtons = () => {
    const dark = root.dataset.theme === "dark";
    buttons.forEach((button) => {
      const label = dark ? "Light mode" : "Dark mode";
      button.setAttribute("aria-label", `Switch to ${label.toLowerCase()}`);
      button.setAttribute("title", `Switch to ${label.toLowerCase()}`);
      button.setAttribute("aria-pressed", String(dark));
      const text = button.querySelector(".theme-label");
      if (text) text.textContent = label;
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = theme;
      updateButtons();
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch (error) {
        console.warn("Vaultly could not save the theme preference.", error);
      }
    });
  });

  updateButtons();
})();

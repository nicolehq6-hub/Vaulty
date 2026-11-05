(() => {
  const card = document.querySelector("#authCard");
  const tabs = document.querySelector("#modeTabs");
  const form = document.querySelector("#authForm");
  const message = document.querySelector("#authMessage");
  const localAuth = window.vaultlyLocalAuth;
  const fields = {
    name: document.querySelector("#fullName"),
    email: document.querySelector("#email"),
    password: document.querySelector("#password"),
    confirmPassword: document.querySelector("#confirmPassword"),
    terms: document.querySelector("#terms"),
  };
  const copy = {
    signin: {
      headline: "Welcome",
      headlineAccent: "back home.",
      lead: "Sign in to open the photos and videos saved in this browser on this device.",
      title: "Sign in",
      subtitle: "Your local vault is ready when you are.",
      submit: "Sign in",
      prompt: "New to Vaultly?",
      switch: "Create an account",
      pageTitle: "Vaultly | Sign in",
    },
    signup: {
      headline: "Start your",
      headlineAccent: "vault today.",
      lead: "Create a calm, private home for your photos and videos on this device.",
      title: "Create account",
      subtitle: "Set up your personal vault on this device.",
      submit: "Create account",
      prompt: "Already have an account?",
      switch: "Sign in",
      pageTitle: "Vaultly | Create account",
    },
  };
  const dashboardUrl = new URL("dashboard.html", window.location.href).toString();
  let mode = "signin";
  let redirectStarted = false;

  const redirectToDashboard = () => {
    if (redirectStarted) return;
    redirectStarted = true;
    try {
      sessionStorage.setItem("vaultly-dashboard-splash", "1");
    } catch (error) {
      // The dashboard works without the optional splash preference.
    }
    window.location.replace(dashboardUrl);
  };

  const setBusy = (busy) => {
    document.querySelector("#submitText").textContent = busy ? "Please wait..." : copy[mode].submit;
    form.querySelectorAll("button, input").forEach((control) => {
      control.disabled = busy;
    });
    tabs.querySelectorAll("button").forEach((control) => {
      control.disabled = busy;
    });
    document.querySelector("#switchMode").disabled = busy;
  };

  const showErrorMessage = (error, fallback) => {
    message.classList.remove("success");
    message.textContent = error && error.message ? error.message : fallback;
  };

  const clearErrors = () => {
    document.querySelectorAll(".field-error.show").forEach((error) => error.classList.remove("show"));
    document.querySelectorAll("#authForm .invalid").forEach((field) => field.classList.remove("invalid"));
  };

  const showError = (field, invalid) => {
    const error = document.querySelector(`[data-error="${field}"]`);
    const input = fields[field];
    if (error) error.classList.toggle("show", invalid);
    if (input && input.type !== "checkbox") input.classList.toggle("invalid", invalid);
    return invalid;
  };

  const setMode = (nextMode, updateUrl = true) => {
    mode = nextMode;
    const content = copy[mode];
    card.classList.toggle("is-signup", mode === "signup");
    tabs.classList.toggle("signup", mode === "signup");
    tabs.querySelectorAll("[role=tab]").forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    document.querySelector("#auth-headline").innerHTML = `${content.headline}<br /><em>${content.headlineAccent}</em>`;
    document.querySelector("#auth-lead").textContent = content.lead;
    document.querySelector("#formTitle").textContent = content.title;
    document.querySelector("#formSubtitle").textContent = content.subtitle;
    document.querySelector("#submitText").textContent = content.submit;
    document.querySelector("#switchPrompt").textContent = content.prompt;
    document.querySelector("#switchMode").textContent = content.switch;
    fields.password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    document.title = content.pageTitle;
    message.textContent = "";
    message.classList.remove("success");
    clearErrors();
    if (updateUrl) history.replaceState(null, "", `#${mode}`);
  };

  tabs.querySelectorAll("[role=tab]").forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });
  document.querySelector("#switchMode").addEventListener("click", () => {
    setMode(mode === "signin" ? "signup" : "signin");
  });
  document.querySelector("#passwordToggle").addEventListener("click", (event) => {
    const show = fields.password.type === "password";
    fields.password.type = show ? "text" : "password";
    fields.confirmPassword.type = show ? "text" : "password";
    event.currentTarget.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("success");
    clearErrors();

    let invalid = false;
    if (mode === "signup") invalid = showError("name", !fields.name.value.trim()) || invalid;
    invalid = showError("email", !fields.email.validity.valid || !fields.email.value.trim()) || invalid;
    const password = fields.password.value;
    const weakPassword = mode === "signup"
      ? password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)
      : password.length < 1;
    invalid = showError("password", weakPassword) || invalid;
    if (mode === "signup") {
      invalid = showError("confirmPassword", fields.confirmPassword.value !== password) || invalid;
      invalid = showError("terms", !fields.terms.checked) || invalid;
    }
    if (invalid) {
      message.textContent = "Please correct the highlighted fields.";
      return;
    }
    if (!localAuth) {
      showErrorMessage(null, "Local accounts could not be loaded. Reload Vaultly and try again.");
      return;
    }

    setBusy(true);
    try {
      const email = fields.email.value.trim();
      if (mode === "signup") {
        await localAuth.register(email, password, fields.name.value.trim());
      } else {
        await localAuth.signIn(email, password);
      }
      redirectToDashboard();
    } catch (error) {
      showErrorMessage(error, mode === "signup"
        ? "Your local account could not be created. Please try again."
        : "We could not sign you in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  });

  setMode(location.hash === "#signup" ? "signup" : "signin", false);

  if (!localAuth) {
    showErrorMessage(null, "Local accounts could not be loaded. Reload Vaultly and try again.");
    return;
  }
  try {
    if (localAuth.getSession()) redirectToDashboard();
  } catch (error) {
    showErrorMessage(error, "We could not verify your saved sign-in.");
  }
})();

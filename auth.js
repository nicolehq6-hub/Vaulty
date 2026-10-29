(() => {
  const card = document.querySelector("#authCard");
  const tabs = document.querySelector("#modeTabs");
  const form = document.querySelector("#authForm");
  const message = document.querySelector("#authMessage");
  const resendBtn = document.querySelector("#resendConfirm");
  const supabase = window.vaultlySupabase;
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
      lead: "Sign in to open the photos and videos you keep close. Everything stays private by default.",
      title: "Sign in",
      subtitle: "Good to see you again.",
      submit: "Sign in",
      prompt: "New to Vaultly?",
      switch: "Create an account",
      pageTitle: "Vaultly | Sign in",
    },
    signup: {
      headline: "Start your",
      headlineAccent: "vault today.",
      lead: "Create a calm home for the photos and videos you want to keep close. It only takes a minute.",
      title: "Create account",
      subtitle: "Set up your personal vault.",
      submit: "Create account",
      prompt: "Already have an account?",
      switch: "Sign in",
      pageTitle: "Vaultly | Create account",
    },
  };
  let mode = "signin";

  const dashboardUrl = new URL("dashboard.html", window.location.href).toString();
  const googleCallbackUrl = new URL("auth.html?oauth=google", window.location.href).toString();
  const isGoogleCallback = new URLSearchParams(window.location.search).get("oauth") === "google";
  let oauthRedirectStarted = false;

  const redirectToDashboard = () => {
    if (oauthRedirectStarted) return;
    oauthRedirectStarted = true;
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
    document.querySelector("#googleSignIn").disabled = busy;
    document.querySelector("#switchMode").disabled = busy;
  };

  const showAuthError = (error, fallback) => {
    message.classList.remove("success");
    message.textContent = error && error.message ? error.message : fallback;
  };

  const showConfirmationNotice = (email) => {
    message.classList.add("success");
    message.textContent = `Account created successfully! Please check ${email} for the confirmation link to activate your account. If you use Gmail, check your Gmail inbox. If you don't see the message, check your spam folder.`;
  };
  const showResend = () => {
    if (resendBtn) resendBtn.hidden = false;
  };

  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      const email = fields.email.value.trim();
      if (!email || !fields.email.validity.valid) {
        message.classList.remove("success");
        message.textContent = "Enter your email address first.";
        return;
      }
      if (!supabase) {
        showAuthError(null, window.vaultlySupabaseError || "Authentication is not configured.");
        return;
      }
      resendBtn.disabled = true;
      try {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: new URL("auth.html", window.location.href).toString() },
        });
        if (error) {
          showAuthError(error, "We could not resend the email. Please try again in a minute.");
        } else {
          message.classList.add("success");
          message.textContent = `Confirmation email sent again to ${email}. Check your inbox and spam folder.`;
        }
      } catch (error) {
        showAuthError(error, "We could not resend the email. Please try again in a minute.");
      } finally {
        setTimeout(() => { resendBtn.disabled = false; }, 60000);
      }
    });
  }

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
    if (resendBtn) resendBtn.hidden = true;
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
  document.querySelector("#forgotPassword").addEventListener("click", () => {
    const url = new URL("forgot-password.html", window.location.href);
    if (fields.email.value.trim()) url.searchParams.set("email", fields.email.value.trim());
    window.location.assign(url);
  });
  document.querySelector("#googleSignIn").addEventListener("click", async () => {
    if (!supabase) {
      message.textContent = window.vaultlySupabaseError || "Authentication is not configured.";
      return;
    }
    if (window.location.protocol === "file:") {
      message.textContent = "Google sign-in requires a local web server. Open Vaultly at an http://localhost or http://127.0.0.1 address, then try again.";
      return;
    }

    message.textContent = "Connecting to Google...";
    document.querySelector("#googleSignIn").disabled = true;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: googleCallbackUrl },
      });
      if (error) showAuthError(error, "Google sign-in could not be started.");
    } catch (error) {
      showAuthError(error, "We could not reach Google sign-in. Check your connection and try again.");
    } finally {
      document.querySelector("#googleSignIn").disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    message.classList.remove("success");
    clearErrors();
    let invalid = false;
    if (mode === "signup") invalid = showError("name", !fields.name.value.trim()) || invalid;
    invalid = showError("email", !fields.email.validity.valid || !fields.email.value.trim()) || invalid;
    invalid = showError("password", fields.password.value.length < (mode === "signup" ? 8 : 1)) || invalid;
    if (mode === "signup") {
      invalid = showError("confirmPassword", fields.confirmPassword.value !== fields.password.value) || invalid;
      invalid = showError("terms", !fields.terms.checked) || invalid;
    }
    if (invalid) {
      message.textContent = "Please correct the highlighted fields.";
      return;
    }

    if (!supabase) {
      message.textContent = window.vaultlySupabaseError || "Authentication is not configured.";
      return;
    }

    setBusy(true);
    try {
      const email = fields.email.value.trim();
      const password = fields.password.value;

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fields.name.value.trim() } },
        });
        if (error) {
          showAuthError(error, "Your account could not be created.");
        } else if (data.session) {
          window.location.assign(dashboardUrl);
        } else {
          showAuthError(null, "Account created, but Supabase still requires email confirmation. Turn off 'Confirm email' in the dashboard.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          showAuthError(error, "We could not sign you in. Check your email and password.");
        } else if (data.session) {
          window.location.assign(dashboardUrl);
        } else {
          message.textContent = "Sign-in did not return a valid session. Please try again.";
        }
      }
    } catch (error) {
      showAuthError(error, "We could not reach the authentication service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  });

  setMode(location.hash === "#signup" ? "signup" : "signin", false);

  if (!supabase) {
    message.textContent = window.vaultlySupabaseError || "Authentication is not configured.";
  } else {
    if (isGoogleCallback) {
      setBusy(true);
      message.textContent = "Finishing Google sign-in...";
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) redirectToDashboard();
      });
    }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        showAuthError(error, "We could not verify your sign-in session.");
      } else if (data.session) {
        redirectToDashboard();
      } else if (isGoogleCallback) {
        const callbackParams = new URLSearchParams(window.location.search);
        const callbackError = callbackParams.get("error_description") || callbackParams.get("error");
        showAuthError(
          callbackError ? new Error(callbackError.replace(/\+/g, " ")) : null,
          "Google sign-in did not return a session. Please try again."
        );
      }
    }).catch((error) => {
      showAuthError(error, "We could not reach the authentication service. Check your connection and try again.");
    }).finally(() => {
      if (isGoogleCallback) setBusy(false);
    });
  }
})();

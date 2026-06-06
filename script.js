(function () {
  const STORAGE_USERS = "qstudy_users";
  const STORAGE_SESSION = "qstudy_session";

  const guestShell = document.getElementById("guest-shell");
  const dashboardShell = document.getElementById("dashboard-shell");
  const menuBtn = document.querySelector(".menu-btn");
  const sideMenu = document.getElementById("side-menu");
  const backdrop = document.querySelector(".menu-backdrop");
  const views = document.querySelectorAll("#guest-shell .view");
  const dockBtns = document.querySelectorAll(".dock-btn[data-nav]");
  const motionToggle = document.getElementById("reduced-motion-toggle");
  const dashMotionToggle = document.getElementById("dash-reduced-motion");
  const profileBtn = document.getElementById("profile-btn");
  const profileInitial = document.getElementById("profile-initial");
  const profileIcon = document.querySelector(".profile-avatar__icon");
  const authGuest = document.getElementById("auth-guest");
  const dashLogoutBtn = document.getElementById("dash-logout-btn");
  const loginForm = document.querySelector("#panel-login");
  const signupForm = document.querySelector("#panel-signup");
  const loginMessage = document.getElementById("login-message");
  const signupMessage = document.getElementById("signup-message");
  // FIX: settings-email only exists in guest settings view
  const settingsEmail = document.getElementById("settings-email");
  const dashSettingsEmail = document.getElementById("dash-settings-email");
  const dashUserName = document.getElementById("dash-user-name");
  const authTabs = document.querySelectorAll("[data-auth-tab]");
  const authPanels = document.querySelectorAll("[data-auth-panel]");
  const dashNavLinks = document.querySelectorAll("[data-dash-nav]");
  const dashPages = document.querySelectorAll("[data-dash-page]");
  const createTaskBtn = document.querySelector(".dash-task-card__btn");
  const subjectGrid = document.getElementById("subject-grid");
  const subjectBack = document.getElementById("subject-back");
  const subjectBadge = document.getElementById("subject-badge");
  const subjectTitle = document.getElementById("subject-title");
  const subjectDesc = document.getElementById("subject-desc");
  const subjectModules = document.getElementById("subject-modules");
  const dashMain = document.querySelector(".dash-main");

  const SUBJECTS = [
    { id: "math", name: "Math", abbr: "Ma", accent: "linear-gradient(135deg, #6366f1, #4f46e5)", desc: "Algebra, geometry, calculus, and problem solving." },
    { id: "physics", name: "Physics", abbr: "Ph", accent: "linear-gradient(135deg, #3b82f6, #2563eb)", desc: "Mechanics, energy, waves, and modern physics." },
    { id: "chemistry", name: "Chemistry", abbr: "Ch", accent: "linear-gradient(135deg, #14b8a6, #0d9488)", desc: "Elements, reactions, stoichiometry, and lab skills." },
    { id: "biology", name: "Biology", abbr: "Bi", accent: "linear-gradient(135deg, #22c55e, #16a34a)", desc: "Cells, genetics, ecology, and human biology." },
    { id: "english", name: "English Language", abbr: "En", accent: "linear-gradient(135deg, #f59e0b, #d97706)", desc: "Reading, writing, grammar, and communication." },
    { id: "kazakh-lang", name: "Kazakh Language", abbr: "Kz", accent: "linear-gradient(135deg, #06b6d4, #0891b2)", desc: "Grammar, vocabulary, literature, and composition." },
    { id: "russian-lang", name: "Russian Language", abbr: "Ru", accent: "linear-gradient(135deg, #ef4444, #dc2626)", desc: "Grammar, vocabulary, literature, and composition." },
    { id: "geography", name: "Geography", abbr: "Ge", accent: "linear-gradient(135deg, #84cc16, #65a30d)", desc: "Physical and human geography, maps, and regions." },
    { id: "engineering", name: "Engineering", abbr: "Eg", accent: "linear-gradient(135deg, #f97316, #ea580c)", desc: "Design, systems, materials, and applied science." },
    { id: "it", name: "IT", abbr: "IT", accent: "linear-gradient(135deg, #8b5cf6, #7c3aed)", desc: "Programming, networks, databases, and digital literacy." },
    { id: "kazakh-history", name: "Kazakh History", abbr: "KH", accent: "linear-gradient(135deg, #a855f7, #9333ea)", desc: "Kazakhstan from ancient times to the present." },
    { id: "world-history", name: "World History", abbr: "WH", accent: "linear-gradient(135deg, #ec4899, #db2777)", desc: "Global civilizations, conflicts, and change over time." },
    { id: "global-perspectives", name: "Global Perspectives", abbr: "GP", accent: "linear-gradient(135deg, #64748b, #475569)", desc: "Critical thinking, research, and global issues." },
  ];

  let subjectsRendered = false;

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]"); }
    catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(STORAGE_SESSION) || "null"); }
    catch { return null; }
  }

  function setSession(user) {
    if (user) {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify({ email: user.email, name: user.name }));
    } else {
      localStorage.removeItem(STORAGE_SESSION);
    }
    updateAuthUI();
    updateDashboardUser();
  }

  async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function getInitial(name) {
    const parts = (name || "Q").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || "Q").toUpperCase();
  }

  function getFirstName(name) {
    return (name || "Student").trim().split(/\s+/)[0];
  }

  function showMessage(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    el.classList.toggle("auth-message--error", isError);
    el.classList.toggle("auth-message--success", !isError);
  }

  function hideMessages() {
    [loginMessage, signupMessage].forEach((el) => { if (el) el.hidden = true; });
  }

  // FIX: show inline toast instead of alert()
  function showToast(message, type = "success") {
    let toast = document.getElementById("qs-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "qs-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "qs-toast qs-toast--" + type + " qs-toast--show";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("qs-toast--show"), 3000);
  }

  function updateDashboardUser() {
    const session = getSession();
    const displayName = session ? getFirstName(session.name) : "Student";
    if (dashUserName) dashUserName.textContent = displayName;
    if (dashSettingsEmail && session) dashSettingsEmail.value = session.email;
    // Update dashboard stats greeting
    const dashGreeting = document.getElementById("dash-greeting");
    if (dashGreeting && session) dashGreeting.textContent = displayName;
  }

  function updateAuthUI() {
    const session = getSession();
    if (session) {
      // FIX: was incorrectly setting hidden=false for both branches
      if (authGuest) authGuest.hidden = false;
      if (settingsEmail) {
        settingsEmail.value = session.email;
        settingsEmail.readOnly = true;
      }
      if (profileBtn) profileBtn.setAttribute("aria-label", `Account — signed in as ${session.name}`);
      if (profileInitial) {
        profileInitial.textContent = getInitial(session.name);
        profileInitial.hidden = false;
      }
      if (profileIcon) profileIcon.hidden = true;
      profileBtn?.classList.add("profile-avatar--signed-in");
    } else {
      if (authGuest) authGuest.hidden = false;
      if (settingsEmail) {
        settingsEmail.value = "";
        settingsEmail.readOnly = false;
        settingsEmail.placeholder = "Sign in to link your email";
      }
      if (profileBtn) profileBtn.setAttribute("aria-label", "Account — log in or sign up");
      if (profileInitial) profileInitial.hidden = true;
      if (profileIcon) profileIcon.hidden = false;
      profileBtn?.classList.remove("profile-avatar--signed-in");
    }
  }

  function enterDashboard(page) {
    document.body.classList.add("dashboard-active");
    if (guestShell) guestShell.hidden = true;
    if (dashboardShell) dashboardShell.hidden = false;
    updateDashboardUser();
    renderSubjectGrid();
    setDashboardPage(page || "home");
    closeMenu();
  }

  function exitDashboard() {
    document.body.classList.remove("dashboard-active");
    if (guestShell) guestShell.hidden = false;
    if (dashboardShell) dashboardShell.hidden = true;
    setView("home");
    setAuthTab("login");
    hideMessages();
  }

  function getSubject(id) { return SUBJECTS.find((s) => s.id === id); }

  function getDefaultModules(subjectName) {
    return [
      { title: "Introduction", text: `Overview of ${subjectName} and key topics for this term.` },
      { title: "Core concepts", text: "Fundamental ideas, vocabulary, and worked examples." },
      { title: "Practice", text: "Exercises, quizzes, and self-check questions." },
      { title: "Review", text: "Summary notes and exam-style preparation." },
    ];
  }

  function renderSubjectGrid() {
    if (!subjectGrid || subjectsRendered) return;
    subjectGrid.innerHTML = SUBJECTS.map(
      (s) => `
        <button type="button" class="subject-card" data-subject-id="${s.id}" role="listitem">
          <span class="subject-card__icon" style="--subject-accent: ${s.accent}">${s.abbr}</span>
          <span class="subject-card__title">${s.name}</span>
          <span class="subject-card__meta">Open class →</span>
        </button>
      `
    ).join("");
    subjectGrid.querySelectorAll("[data-subject-id]").forEach((btn) => {
      btn.addEventListener("click", () => openSubject(btn.dataset.subjectId));
    });
    subjectsRendered = true;
  }

  function openSubject(id) {
    const subject = getSubject(id);
    if (!subject) return;
    if (subjectBadge) {
      subjectBadge.textContent = subject.abbr;
      subjectBadge.style.background = subject.accent;
    }
    if (subjectTitle) subjectTitle.textContent = subject.name;
    if (subjectDesc) subjectDesc.textContent = subject.desc;
    if (subjectModules) {
      const modules = getDefaultModules(subject.name);
      subjectModules.innerHTML = modules.map((m, i) => `
        <article class="subject-module">
          <span class="subject-module__num">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3>${m.title}</h3>
            <p>${m.text}</p>
          </div>
        </article>
      `).join("");
    }
    setDashboardPage("subject");
    dashMain?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setDashboardPage(page) {
    const inLessons = page === "lessons" || page === "subject";
    dashNavLinks.forEach((link) => {
      const nav = link.dataset.dashNav;
      const active = nav === page || (nav === "lessons" && inLessons);
      link.classList.toggle("dash-nav__link--active", active);
    });
    dashPages.forEach((section) => {
      const active = section.dataset.dashPage === page;
      section.hidden = !active;
      section.classList.toggle("dash-page--active", active);
    });
    if (page === "lessons") {
      renderSubjectGrid();
      dashMain?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function setAuthTab(tab) {
    authTabs.forEach((btn) => {
      const active = btn.dataset.authTab === tab;
      btn.classList.toggle("auth-tab--active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    authPanels.forEach((panel) => {
      const active = panel.dataset.authPanel === tab;
      panel.classList.toggle("auth-panel--active", active);
      panel.hidden = !active;
    });
    hideMessages();
  }

  function setView(name) {
    views.forEach((view) => {
      const match = view.dataset.view === name;
      view.hidden = !match;
      view.classList.toggle("view--active", match);
    });
    dockBtns.forEach((btn) => {
      const active = btn.dataset.nav === name;
      btn.classList.toggle("dock-btn--active", active);
      // FIX: use removeAttribute instead of setting null string
      if (btn.dataset.nav === "home" || btn.dataset.nav === "settings") {
        if (active) btn.setAttribute("aria-current", "page");
        else btn.removeAttribute("aria-current");
      }
    });
    if (name === "auth") hideMessages();
    closeMenu();
  }

  function onAuthSuccess() {
    hideMessages();
    enterDashboard("home");
  }

  function openMenu() {
    menuBtn?.setAttribute("aria-expanded", "true");
    if (sideMenu) sideMenu.hidden = false;
    if (backdrop) backdrop.hidden = false;
  }

  function closeMenu() {
    menuBtn?.setAttribute("aria-expanded", "false");
    if (sideMenu) sideMenu.hidden = true;
    if (backdrop) backdrop.hidden = true;
  }

  function logout() {
    setSession(null);
    exitDashboard();
    showToast("Logged out successfully.");
  }

  // FIX: button loading state to prevent double-submit
  function setSubmitLoading(btn, loading, defaultText) {
    btn.disabled = loading;
    btn.textContent = loading ? "Please wait…" : defaultText;
  }

  profileBtn?.addEventListener("click", () => {
    if (getSession()) enterDashboard("setting");
    else setView("auth");
  });

  menuBtn?.addEventListener("click", () => {
    const open = menuBtn.getAttribute("aria-expanded") === "true";
    open ? closeMenu() : openMenu();
  });

  backdrop?.addEventListener("click", closeMenu);

  sideMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view === "auth" && getSession()) { enterDashboard("setting"); return; }
      if (view) setView(view);
    });
  });

  document.querySelectorAll("[data-view-link]").forEach((el) => {
    el.addEventListener("click", () => {
      const view = el.dataset.viewLink;
      if (view) setView(view);
    });
  });

  dockBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const nav = btn.dataset.nav;
      if (getSession() && nav === "settings") { enterDashboard("setting"); return; }
      if (nav) setView(nav);
    });
  });

  document.getElementById("home-cta")?.addEventListener("click", () => {
    if (getSession()) enterDashboard("home");
    else setView("auth");
  });

  dashNavLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = link.dataset.dashNav;
      if (page) setDashboardPage(page);
    });
  });

  // Quick-start cards on dashboard home (added after initial DOM query)
  document.getElementById("dashboard-shell")?.addEventListener("click", (e) => {
    const card = e.target.closest(".dash-quick-card[data-dash-nav]");
    if (card) {
      const page = card.dataset.dashNav;
      if (page) setDashboardPage(page);
    }
  });

  subjectBack?.addEventListener("click", () => setDashboardPage("lessons"));

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => setAuthTab(tab.dataset.authTab));
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();
    const submitBtn = loginForm.querySelector("[type=submit]");
    setSubmitLoading(submitBtn, true, "Log in");
    const fd = new FormData(loginForm);
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const users = getUsers();
    const user = users.find((u) => u.email === email);
    if (!user) {
      showMessage(loginMessage, "No account found with this email. Sign up first.", true);
      setSubmitLoading(submitBtn, false, "Log in");
      return;
    }
    const hash = await hashPassword(password);
    if (user.passwordHash !== hash) {
      showMessage(loginMessage, "Incorrect password. Try again.", true);
      setSubmitLoading(submitBtn, false, "Log in");
      return;
    }
    setSession({ email: user.email, name: user.name });
    loginForm.reset();
    setSubmitLoading(submitBtn, false, "Log in");
    onAuthSuccess();
  });

  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessages();
    const submitBtn = signupForm.querySelector("[type=submit]");
    setSubmitLoading(submitBtn, true, "Create account");
    const fd = new FormData(signupForm);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    if (password !== confirm) {
      showMessage(signupMessage, "Passwords do not match.", true);
      setSubmitLoading(submitBtn, false, "Create account");
      return;
    }
    if (password.length < 6) {
      showMessage(signupMessage, "Password must be at least 6 characters.", true);
      setSubmitLoading(submitBtn, false, "Create account");
      return;
    }
    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      showMessage(signupMessage, "An account with this email already exists. Log in instead.", true);
      setAuthTab("login");
      setSubmitLoading(submitBtn, false, "Create account");
      return;
    }
    const passwordHash = await hashPassword(password);
    users.push({ name, email, passwordHash, createdAt: Date.now() });
    saveUsers(users);
    setSession({ email, name });
    signupForm.reset();
    setSubmitLoading(submitBtn, false, "Create account");
    onAuthSuccess();
  });

  dashLogoutBtn?.addEventListener("click", logout);

  function syncMotion(reduced) {
    document.body.classList.toggle("reduce-motion", reduced);
    if (motionToggle) motionToggle.checked = reduced;
    if (dashMotionToggle) dashMotionToggle.checked = reduced;
  }

  motionToggle?.addEventListener("change", () => syncMotion(motionToggle.checked));
  dashMotionToggle?.addEventListener("change", () => syncMotion(dashMotionToggle.checked));

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) syncMotion(true);

  // FIX: replaced alert() with toast
  document.querySelector(".settings-form .btn-glow")?.addEventListener("click", () => {
    showToast("Preferences saved.");
  });

  // FIX: replaced alert() with toast
  createTaskBtn?.addEventListener("click", () => {
    setDashboardPage("tasks");
    showToast("Task creation coming soon!", "info");
  });

  updateAuthUI();
  updateDashboardUser();

  if (getSession()) enterDashboard("home");
  else setView("home");
})();

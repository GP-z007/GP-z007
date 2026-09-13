const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const cursor = $(".cursor");

if (cursor && matchMedia("(pointer:fine)").matches) {
  window.addEventListener("mousemove", (event) => {
    cursor.style.opacity = "1";
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });

  $$("a, button, summary").forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.13, rootMargin: "0px 0px -6% 0px" }
);

$$(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

$$("[data-parallax]").forEach((element) => {
  const amount = Number(element.dataset.parallax || 0.06);

  window.addEventListener(
    "scroll",
    () => {
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewport) return;
      const progress = (viewport - rect.top) / (viewport + rect.height);
      const offset = (progress - 0.5) * amount * 400;
      element.style.transform = `translate3d(0, ${offset}px, 0)`;
    },
    { passive: true }
  );
});

$$(".magnetic").forEach((element) => {
  if (!matchMedia("(pointer:fine)").matches) return;

  element.addEventListener("mousemove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
  });

  element.addEventListener("mouseleave", () => {
    element.style.transform = "";
  });
});

const commandBox = $(".command-box");
if (commandBox) {
  commandBox.addEventListener("click", async () => {
    const value = commandBox.dataset.copy || "";
    const state = $(".copy-state", commandBox);

    try {
      await navigator.clipboard.writeText(value);
      if (state) {
        state.textContent = "COPIED";
        setTimeout(() => (state.textContent = "COPY"), 1400);
      }
    } catch {
      window.open(value, "_blank", "noopener,noreferrer");
    }
  });
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

async function loadGitHub() {
  const username = "GP-z007";

  try {
    const profileResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      $$("[data-gh]").forEach((node) => {
        const key = node.dataset.gh;
        if (key in profile) node.textContent = profile[key];
      });
    }
  } catch {
    // Keep the em dash fallback.
  }

  const repoGrid = $("#repo-grid");
  if (!repoGrid) return;

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=9&type=owner`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) throw new Error("GitHub API unavailable");

    const repos = (await response.json())
      .filter((repo) => !repo.fork)
      .slice(0, 6);

    if (!repos.length) throw new Error("No repos");

    repoGrid.innerHTML = repos
      .map(
        (repo, index) => `
          <a class="repo-card reveal is-visible" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer">
            <div class="repo-top">
              <span>0${index + 1}</span>
              <span>${escapeHtml(repo.language || "REPOSITORY")}</span>
            </div>
            <h3>${escapeHtml(repo.name)}</h3>
            <p>${escapeHtml(repo.description || `Updated ${formatDate(repo.updated_at)}`)}</p>
          </a>
        `
      )
      .join("");
  } catch {
    repoGrid.innerHTML = `
      <a class="repo-card reveal is-visible" href="https://github.com/GP-z007" target="_blank" rel="noreferrer">
        <div class="repo-top"><span>01</span><span>GITHUB</span></div>
        <h3>GP-z007</h3>
        <p>GitHub API rate-limited this preview. Open the profile directly to browse the latest repositories.</p>
      </a>
    `;
  }
}

loadGitHub();

$$(".faq-item").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    $$(".faq-item").forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

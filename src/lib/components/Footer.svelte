<footer>
  <details class="about">
    <summary>Über diese Seite</summary>
    <div class="about-body">
      <p>Made with 🫩 um 02:25 an nem Donnerstag.</p>
      <p>Helft gerne das Ding bugfrei zu bekommen. lol</p>
      <a href="https://github.com/samsour/wirsindalt-wtf" target="_blank" rel="noopener">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        github.com/samsour/wirsindalt-wtf
      </a>
    </div>
  </details>
</footer>

<style>
  footer { text-align: center; padding: 2rem 1.5rem; border-top: 1px solid var(--border); margin-top: 2rem; }

  .about { display: inline-block; }
  summary {
    font-size: 12px; color: var(--ink3); cursor: pointer;
    list-style: none; user-select: none;
  }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: ' ↓'; }
  details[open] summary::after { content: ' ↑'; }
  summary:hover { color: var(--ink); }

  .about-body {
    margin-top: .75rem;
    display: flex; flex-direction: column; align-items: center; gap: .4rem;
    font-size: 12px; color: var(--ink3); line-height: 1.6;
  }
  .about-body a {
    display: inline-flex; align-items: center; gap: .35rem;
    color: var(--ink3); text-decoration: none; margin-top: .25rem;
  }
  .about-body a:hover { color: var(--ink); }
  .about-body svg { width: 13px; height: 13px; flex-shrink: 0; }
</style>

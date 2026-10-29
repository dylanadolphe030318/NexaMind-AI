import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="page-shell">
        <header className="site-header">
          <Link className="brand" href="/" aria-label="NexaMind AI, accueil">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M7 23V9l9 10V9l9 14V9"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
            </span>
            <span>
              NexaMind <span className="brand-ai">AI</span>
            </span>
          </Link>

          <nav className="header-actions" aria-label="Navigation principale">
            <Link className="header-login" href="/login">
              Se connecter
            </Link>
            <Link className="button button-small" href="/signup">
              Créer un compte
            </Link>
          </nav>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              Votre savoir, en mouvement
            </p>
            <h1 id="hero-title">
              Le savoir de votre équipe,
              <span className="title-accent">à portée de question.</span>
            </h1>
            <p className="hero-description">
              NexaMind AI vous aide à organiser vos ressources et à retrouver
              les réponses qui comptent, avec un assistant ancré dans votre
              savoir partagé.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/signup">
                Créer un compte
                <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href="/login">
                Déjà membre ? Se connecter
              </Link>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-glow" />
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <div className="art-core">
              <span className="core-spark">✳</span>
              <span className="core-label">N</span>
            </div>
            <span className="art-star star-one">✦</span>
            <span className="art-star star-two">✧</span>
            <span className="art-star star-three">✦</span>
            <span className="art-dot dot-one" />
            <span className="art-dot dot-two" />
          </div>
        </section>

        <footer className="site-footer">
          <span>NexaMind AI</span>
          <span>Le savoir partagé, plus accessible.</span>
        </footer>
      </div>
    </main>
  );
}

export default function LoadingConversations() {
  return (
    <main className="auth-page category-page">
      <section aria-labelledby="conversations-loading" className="auth-card category-card">
        <h1 id="conversations-loading">Mes conversations</h1>
        <p className="auth-message auth-message-info" role="status">
          Chargement des conversations&hellip;
        </p>
      </section>
    </main>
  );
}

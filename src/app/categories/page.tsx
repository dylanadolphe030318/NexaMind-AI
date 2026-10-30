import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateCategoryForm } from "@/features/resources/category-forms";
import { CategoryList } from "@/features/resources/category-list";
import { getCategoryPageData } from "@/features/resources/categories";

export const metadata: Metadata = {
  title: "Cat\u00e9gories - NexaMind AI",
  description: "Consulter les cat\u00e9gories de l'espace NexaMind AI.",
};

export const instant = false;

export default async function CategoriesPage() {
  const pageData = await getCategoryPageData();
  if (!pageData) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="categories-title" className="auth-card category-card">
        <Link aria-label="NexaMind AI, accueil" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            <svg fill="none" viewBox="0 0 32 32">
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

        <h1 id="categories-title">Cat&eacute;gories</h1>
        <p className="auth-intro">
          Les cat&eacute;gories disponibles pour classer les ressources de l&apos;&eacute;quipe.
        </p>

        <section aria-label="Liste des categories" className="category-list-section">
          {pageData.categories === null ? (
            <p className="auth-message auth-message-error" role="alert">
              Les cat&eacute;gories ne sont pas disponibles. {" "}
              <Link href="/categories">R&eacute;essayer</Link>
            </p>
          ) : pageData.categories.length ? (
            <CategoryList
              canManage={pageData.canManage}
              categories={pageData.categories}
            />
          ) : (
            <p className="category-empty">Aucune cat&eacute;gorie n&apos;est disponible pour le moment.</p>
          )}
        </section>

        {pageData.canManage ? (
          <section aria-labelledby="create-category-title" className="category-manager">
            <h2 id="create-category-title">Ajouter une cat&eacute;gorie</h2>
            <CreateCategoryForm />
          </section>
        ) : null}

        <Link className="auth-back" href="/dashboard">
          Retour &agrave; l&apos;espace membre
        </Link>
      </section>
    </main>
  );
}

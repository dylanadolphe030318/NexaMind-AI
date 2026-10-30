import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCategoryPageData } from "@/features/resources/categories";
import { CreateResourceForm } from "@/features/resources/resource-forms";

export const metadata: Metadata = {
  title: "Ajouter une ressource - NexaMind AI",
  description: "Ajouter une ressource textuelle pour l'\u00e9quipe.",
};

export const instant = false;

export default async function NewResourcePage() {
  const pageData = await getCategoryPageData();
  if (!pageData) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="new-resource-title" className="auth-card category-card">
        <h1 id="new-resource-title">Ajouter une ressource</h1>
        <p className="auth-intro">
          Saisissez ou collez le titre et le texte, puis choisissez une cat&eacute;gorie.
        </p>

        {pageData.categories === null ? (
          <p className="auth-message auth-message-error" role="alert">
            Les cat&eacute;gories ne sont pas disponibles.{" "}
            <Link href="/resources/new">R&eacute;essayer</Link>
          </p>
        ) : pageData.categories.length ? (
          <CreateResourceForm categories={pageData.categories} />
        ) : (
          <div className="category-empty" role="status">
            <p>Aucune cat&eacute;gorie n&apos;existe encore : une ressource ne peut pas &ecirc;tre enregistr&eacute;e sans cat&eacute;gorie.</p>
            <p>
              Demandez &agrave; un responsable d&apos;en cr&eacute;er une depuis la page{" "}
              <Link href="/categories">Cat&eacute;gories</Link>.
            </p>
          </div>
        )}

        <Link className="auth-back" href="/resources">
          Retour aux ressources
        </Link>
      </section>
    </main>
  );
}

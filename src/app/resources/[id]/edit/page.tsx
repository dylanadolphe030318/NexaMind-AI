import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCategoryPageData } from "@/features/resources/categories";
import { EditResourceForm } from "@/features/resources/resource-forms";
import { getResourceForEdit } from "@/features/resources/resources";

export const metadata: Metadata = {
  title: "Modifier une ressource - NexaMind AI",
  description: "Modifier une ressource de l'\u00e9quipe.",
};

export const instant = false;

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getResourceForEdit(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  // Ressource absente, invisible ou non modifiable : m\u00eame r\u00e9ponse, sans fuite.
  if (result.status === "not-found" || result.status === "forbidden") {
    notFound();
  }

  const pageData = result.status === "ok" ? await getCategoryPageData() : null;
  if (result.status === "ok" && !pageData) {
    redirect("/login");
  }

  return (
    <main className="auth-page category-page">
      <section aria-labelledby="edit-resource-title" className="auth-card category-card">
        <h1 id="edit-resource-title">Modifier la ressource</h1>

        {result.status !== "ok" || !pageData || pageData.categories === null ? (
          <p className="auth-message auth-message-error" role="alert">
            Cette ressource n&apos;est pas disponible pour le moment.{" "}
            <Link href={`/resources/${id}/edit`}>R&eacute;essayer</Link>
          </p>
        ) : (
          <EditResourceForm
            categories={pageData.categories}
            initialValues={{
              title: result.resource.title,
              body: result.resource.body,
              categoryId: result.resource.categoryId,
            }}
            resourceId={result.resource.id}
          />
        )}

        <Link className="auth-back" href={`/resources/${id}`}>
          Retour &agrave; la ressource
        </Link>
      </section>
    </main>
  );
}

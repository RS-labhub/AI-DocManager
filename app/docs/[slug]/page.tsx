import DocsView from "@/components/docs/docs-view";

export default async function DocsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DocsView initialSlug={slug} />;
}

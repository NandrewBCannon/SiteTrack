import { AssetDetailClient } from "@/components/AssetDetailClient";

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  return <AssetDetailClient id={params.id} />;
}

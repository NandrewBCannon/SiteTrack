import { AssetForm } from "@/components/AssetForm";

export default function EditAssetPage({ params }: { params: { id: string } }) {
  return <AssetForm assetId={params.id} />;
}

import ModsList from '@/components/mods/ModsList';

export default function VehicleModsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Modifications</h2>
      <ModsList vehicleId={params.id} />
    </div>
  );
}

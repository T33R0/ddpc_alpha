import ServiceAndRepairs from '@/components/service/ServiceAndRepairs';

export default function VehicleServicePage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Service & Repairs</h2>
      <ServiceAndRepairs vehicleId={params.id} />
    </div>
  );
}

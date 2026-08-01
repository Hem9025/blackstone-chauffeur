import Button from './Button'

export default function VehicleCard({ vehicle }) {
  const { id, name, description, capacity, price_per_km, image_url } = vehicle

  return (
    <div className="flex flex-col overflow-hidden border border-black/10 bg-brand-black text-white">
      <img
        src={image_url || '/vehicle-placeholder.jpg'}
        alt={name}
        className="h-48 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-lg text-white">{name}</h3>
        <p className="text-sm text-white/70">{description}</p>
        <p className="text-xs text-white/50">Capacity: {capacity} passengers</p>
        {price_per_km && (
          <p className="text-sm text-brand-gold">${price_per_km}/km</p>
        )}
        <Button to={`/booking?vehicleId=${id}`} className="mt-auto self-start">
          Book Now
        </Button>
      </div>
    </div>
  )
}

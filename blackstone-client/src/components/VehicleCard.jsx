import Button from './Button'

export default function VehicleCard({ vehicle }) {
  const { id, name, description, capacity, price_per_km, image_url } = vehicle

  return (
    <div className="flex flex-col overflow-hidden rounded-sm border border-brand-gold/20 bg-brand-black-soft text-brand-white">
      <img
        src={image_url || '/vehicle-placeholder.jpg'}
        alt={name}
        className="h-48 w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-lg text-brand-gold">{name}</h3>
        <p className="text-sm text-brand-white/70">{description}</p>
        <p className="text-xs text-brand-white/50">Capacity: {capacity} passengers</p>
        {price_per_km && (
          <p className="text-sm text-brand-champagne">${price_per_km}/km</p>
        )}
        <Button to={`/booking?vehicleId=${id}`} className="mt-auto self-start">
          Book Now
        </Button>
      </div>
    </div>
  )
}

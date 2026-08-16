import PageMeta from '../components/PageMeta'
import AdminPeopleList from '../components/AdminPeopleList'

export default function AdminProvidersPanel() {
  return (
    <div>
      <PageMeta title="Providers" description="Provider bookings and revenue — BlackStone Chauffeur admin." />
      <h1 className="font-heading text-3xl text-brand-black">Providers</h1>
      <div className="mt-2">
        <AdminPeopleList role="provider" />
      </div>
    </div>
  )
}

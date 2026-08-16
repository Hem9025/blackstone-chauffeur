import PageMeta from '../components/PageMeta'
import AdminPeopleList from '../components/AdminPeopleList'

export default function AdminDriversPanel() {
  return (
    <div>
      <PageMeta title="Drivers" description="Driver performance and payouts — BlackStone Chauffeur admin." />
      <h1 className="font-heading text-3xl text-brand-black">Drivers</h1>
      <div className="mt-2">
        <AdminPeopleList role="driver" />
      </div>
    </div>
  )
}

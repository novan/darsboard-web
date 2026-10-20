import type { Unit } from '../lib/api'

// Pilihan unit TK/SD; dipakai Agenda, Murid, dan Laporan.
export function UnitToggle({ unit, onChange }: { unit: Unit; onChange: (u: Unit) => void }) {
  return (
    <div role="group" aria-label="Unit" className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
      {(['TK', 'SD'] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
          aria-pressed={unit === u}
          className={`px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-700 ${
            unit === u ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-navy-50'
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  )
}

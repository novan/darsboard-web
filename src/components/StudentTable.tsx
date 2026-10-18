import { History } from 'lucide-react'
import { Badge } from './ui'

export type StudentRow = { id: number; name: string; className: string; detail: string; behind: boolean }

export function StudentTable({ rows, onOpen }: { rows: StudentRow[]; onOpen: (id: number) => void }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Tidak ada murid yang tertinggal pada temuan ini.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pr-3">Murid</th>
            <th className="py-2 pr-3">Kelas</th>
            <th className="py-2 pr-3">Keterangan</th>
            <th className="py-2">
              <span className="sr-only">Riwayat</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.id}-${r.className}`} className="border-b border-line">
              <th scope="row" className="py-2 pr-3 text-left font-semibold">
                {r.name}
              </th>
              <td className="py-2 pr-3">{r.className}</td>
              <td className="py-2 pr-3">
                {r.behind && <Badge tone="warn">Tertinggal</Badge>} <span className="text-muted">{r.detail}</span>
              </td>
              <td className="py-2 text-right">
                <button
                  onClick={() => onOpen(r.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-navy-700 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-navy-700"
                >
                  <History className="h-3 w-3" aria-hidden /> Riwayat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string; label: string; note?: string }
export type SelectGroup = { label: string; options: SelectOption[] }

// Pilihan dropdown kustom (pola listbox WAI-ARIA): bisa dipakai dengan mouse, sentuhan, dan keyboard
// (panah, Home/End, Enter/Spasi, Esc). Opsi dikelompokkan dengan judul grup.
export function Select({ label, value, groups, onChange }: { label: string; value: string; groups: SelectGroup[]; onChange: (v: string) => void }) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const flat = groups.flatMap((g) => g.options)
  const current = flat.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (open) document.getElementById(`${uid}-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, uid])

  const openMenu = () => {
    setActive(Math.max(0, flat.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const pick = (o: SelectOption) => {
    setOpen(false)
    if (o.value !== value) onChange(o.value)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (open) setActive((i) => Math.min(i + 1, flat.length - 1))
        else openMenu()
        break
      case 'ArrowUp':
        e.preventDefault()
        if (open) setActive((i) => Math.max(i - 1, 0))
        else openMenu()
        break
      case 'Home':
        if (open) {
          e.preventDefault()
          setActive(0)
        }
        break
      case 'End':
        if (open) {
          e.preventDefault()
          setActive(flat.length - 1)
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open) pick(flat[active])
        else openMenu()
        break
      case 'Escape':
        if (open) {
          e.preventDefault()
          setOpen(false)
        }
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  // Indeks awal tiap grup pada daftar rata, untuk id opsi dan navigasi keyboard.
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.options.length, 0))
  return (
    <div ref={root} className="relative flex flex-col gap-1">
      <span id={`${uid}-label`} className="text-xs font-semibold text-muted">
        {label}
      </span>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-labelledby={`${uid}-label`}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="flex min-w-52 items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 text-left text-sm font-semibold text-ink hover:border-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700"
      >
        <span className="truncate">{current?.label ?? 'Pilih'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div
          id={`${uid}-list`}
          role="listbox"
          aria-labelledby={`${uid}-label`}
          className="absolute left-0 top-full z-30 mt-1 max-h-72 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {groups.map((g, gi) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <div className="px-3 pb-1 pt-2 text-xs font-extrabold uppercase tracking-wide text-muted">{g.label}</div>
              {g.options.map((o, oi) => {
                const i = starts[gi] + oi
                const selected = o.value === value
                return (
                  <div
                    key={o.value}
                    id={`${uid}-opt-${i}`}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(o)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                      i === active ? 'bg-navy-50' : ''
                    } ${selected ? 'font-bold text-navy-900' : 'text-ink'}`}
                  >
                    <span>
                      {o.label}
                      {o.note && <span className="ml-2 rounded-full bg-warn-bg px-2 py-0.5 text-xs font-semibold text-warn">{o.note}</span>}
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-navy-700" aria-hidden />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

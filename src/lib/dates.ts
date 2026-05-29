export const DATES = [
  { key: '2026-06-26', label: '26.–27. Jun', month: 'Juni' },
  { key: '2026-07-03', label: '3.–4. Jul', month: 'Juli' },
  { key: '2026-07-10', label: '10.–11. Jul', month: 'Juli' },
  { key: '2026-07-17', label: '17.–18. Jul', month: 'Juli' },
  { key: '2026-07-24', label: '24.–25. Jul', month: 'Juli' },
  { key: '2026-08-01', label: '1.–2. Aug', month: 'August' },
  { key: '2026-08-08', label: '8.–9. Aug', month: 'August' },
  { key: '2026-08-22', label: '22.–23. Aug', month: 'August' },
];

export const ABI_MOTTO = 'immer blau, trotzdem schlau';

export function checkMotto(input: string): boolean {
  return input.trim().toLowerCase().replace(/[^a-zäöü, ]/g, '') ===
    ABI_MOTTO.toLowerCase().replace(/[^a-zäöü, ]/g, '');
}

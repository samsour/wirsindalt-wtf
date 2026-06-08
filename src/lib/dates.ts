export const DATES = [
  { key: '2026-06-26', label: 'Fr 26. Jun', day: 'Fr', month: 'Juni',   weekend: '26.–27. Jun' },
  { key: '2026-06-27', label: 'Sa 27. Jun', day: 'Sa', month: 'Juni',   weekend: '26.–27. Jun' },
  { key: '2026-07-03', label: 'Fr 3. Jul',  day: 'Fr', month: 'Juli',   weekend: '3.–4. Jul' },
  { key: '2026-07-04', label: 'Sa 4. Jul',  day: 'Sa', month: 'Juli',   weekend: '3.–4. Jul' },
  { key: '2026-07-10', label: 'Fr 10. Jul', day: 'Fr', month: 'Juli',   weekend: '10.–11. Jul' },
  { key: '2026-07-11', label: 'Sa 11. Jul', day: 'Sa', month: 'Juli',   weekend: '10.–11. Jul' },
  { key: '2026-07-17', label: 'Fr 17. Jul', day: 'Fr', month: 'Juli',   weekend: '17.–18. Jul' },
  { key: '2026-07-18', label: 'Sa 18. Jul', day: 'Sa', month: 'Juli',   weekend: '17.–18. Jul' },
  { key: '2026-07-24', label: 'Fr 24. Jul', day: 'Fr', month: 'Juli',   weekend: '24.–25. Jul' },
  { key: '2026-07-25', label: 'Sa 25. Jul', day: 'Sa', month: 'Juli',   weekend: '24.–25. Jul' },
  { key: '2026-07-31', label: 'Fr 31. Jul', day: 'Fr', month: 'Juli',   weekend: '31. Jul–1. Aug' },
  { key: '2026-08-01', label: 'Sa 1. Aug',  day: 'Sa', month: 'August', weekend: '31. Jul–1. Aug' },
  { key: '2026-08-07', label: 'Fr 7. Aug',  day: 'Fr', month: 'August', weekend: '7.–8. Aug' },
  { key: '2026-08-08', label: 'Sa 8. Aug',  day: 'Sa', month: 'August', weekend: '7.–8. Aug' },
  { key: '2026-08-14', label: 'Fr 14. Aug', day: 'Fr', month: 'August', weekend: '14.–15. Aug' },
  { key: '2026-08-15', label: 'Sa 15. Aug', day: 'Sa', month: 'August', weekend: '14.–15. Aug' },
  { key: '2026-08-21', label: 'Fr 21. Aug', day: 'Fr', month: 'August', weekend: '21.–22. Aug' },
  { key: '2026-08-22', label: 'Sa 22. Aug', day: 'Sa', month: 'August', weekend: '21.–22. Aug' },
  { key: '2026-08-28', label: 'Fr 28. Aug', day: 'Fr', month: 'August',    weekend: '28.–29. Aug' },
  { key: '2026-08-29', label: 'Sa 29. Aug', day: 'Sa', month: 'August',    weekend: '28.–29. Aug' },
  { key: '2026-09-04', label: 'Fr 4. Sep',  day: 'Fr', month: 'September', weekend: '4.–5. Sep' },
  { key: '2026-09-05', label: 'Sa 5. Sep',  day: 'Sa', month: 'September', weekend: '4.–5. Sep' },
  { key: '2026-09-11', label: 'Fr 11. Sep', day: 'Fr', month: 'September', weekend: '11.–12. Sep' },
  { key: '2026-09-12', label: 'Sa 12. Sep', day: 'Sa', month: 'September', weekend: '11.–12. Sep' },
  { key: '2026-09-18', label: 'Fr 18. Sep', day: 'Fr', month: 'September', weekend: '18.–19. Sep' },
  { key: '2026-09-19', label: 'Sa 19. Sep', day: 'Sa', month: 'September', weekend: '18.–19. Sep' },
  { key: '2026-09-25', label: 'Fr 25. Sep', day: 'Fr', month: 'September', weekend: '25.–26. Sep' },
  { key: '2026-09-26', label: 'Sa 26. Sep', day: 'Sa', month: 'September', weekend: '25.–26. Sep' },
];

// Voting is done, but the final date still needs to be agreed in the planning team.
// Flip to `true` once the date is locked — then the real date shows and RSVP opens.
export const DATE_ANNOUNCED = false;

export const ABI_MOTTO = 'immer blau, trotzdem schlau';

export type MottoCheck = 'correct' | 'comma_missing' | 'wrong';

export function checkMotto(input: string): MottoCheck {
  const withComma = (s: string) => s.trim().toLowerCase().replace(/[^a-zäöü, ]/g, '');
  const noComma   = (s: string) => s.trim().toLowerCase().replace(/[^a-zäöü]/g, '');
  if (withComma(input) === withComma(ABI_MOTTO)) return 'correct';
  if (noComma(input)   === noComma(ABI_MOTTO))   return 'comma_missing';
  return 'wrong';
}

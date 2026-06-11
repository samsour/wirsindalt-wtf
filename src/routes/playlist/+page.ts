import { redirect } from '@sveltejs/kit';

// Friendly entry point for the experimental playlist (phase 4 on the main app).
export function load() {
  throw redirect(307, '/?step=4');
}

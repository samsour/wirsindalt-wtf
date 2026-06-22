<script lang="ts">
  // Keyless Google Maps embed from a free-text address query.
  let { query }: { query: string } = $props();
  let src = $derived(`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`);
</script>

<div class="map">
  <iframe title="Karte zum Veranstaltungsort" {src} loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
</div>

<style>
  .map { aspect-ratio: 16 / 10; border-radius: 14px; overflow: hidden; border: 1px solid var(--border); margin-bottom: 1.5rem; }
  .map iframe { width: 100%; height: 100%; border: 0; display: block; }
</style>

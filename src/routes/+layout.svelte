<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';
  import '../app.css';
  import Footer from '$lib/components/Footer.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
  <meta property="og:title" content="CvSS ABI '16 - 10 Jahre schulfrei" />
  <meta property="og:description" content="Wann, wie und wo für unser 10-Jahres-Treffen." />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="/og-image.png" />
</svelte:head>

{@render children()}
<Footer />

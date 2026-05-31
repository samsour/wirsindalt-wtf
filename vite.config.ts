import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'ABI 2016 Reunion',
				short_name: "ABI '16",
				description: '10 Jahre – wann passt\'s dir?',
				theme_color: '#faf9f6',
				background_color: '#faf9f6',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: 'icon-192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
		}),
	]
});


// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/anmeldung" | "/api" | "/api/auth" | "/api/contributions" | "/api/emoji" | "/api/events" | "/api/ideas" | "/api/init" | "/api/locations" | "/api/presence" | "/api/rsvp" | "/api/songs" | "/api/songs/genres" | "/api/songs/search" | "/api/time-votes" | "/api/votes" | "/planung" | "/playlist";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/anmeldung": Record<string, never>;
			"/api": Record<string, never>;
			"/api/auth": Record<string, never>;
			"/api/contributions": Record<string, never>;
			"/api/emoji": Record<string, never>;
			"/api/events": Record<string, never>;
			"/api/ideas": Record<string, never>;
			"/api/init": Record<string, never>;
			"/api/locations": Record<string, never>;
			"/api/presence": Record<string, never>;
			"/api/rsvp": Record<string, never>;
			"/api/songs": Record<string, never>;
			"/api/songs/genres": Record<string, never>;
			"/api/songs/search": Record<string, never>;
			"/api/time-votes": Record<string, never>;
			"/api/votes": Record<string, never>;
			"/planung": Record<string, never>;
			"/playlist": Record<string, never>
		};
		Pathname(): "/" | "/anmeldung" | "/api/auth" | "/api/contributions" | "/api/emoji" | "/api/events" | "/api/ideas" | "/api/init" | "/api/locations" | "/api/presence" | "/api/rsvp" | "/api/songs" | "/api/songs/genres" | "/api/songs/search" | "/api/time-votes" | "/api/votes" | "/planung" | "/playlist";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.DS_Store" | "/aULpFqR8APQ.jpg" | "/aULpFqR8APQ.mp4" | "/icon-192.png" | "/icon-512.png" | "/immerblau-pixel.png" | "/immerblau.png" | "/og-image.png" | "/robots.txt" | string & {};
	}
}
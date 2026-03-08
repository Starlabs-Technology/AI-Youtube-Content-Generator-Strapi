'use strict';

// IMPORTANT:
// Strapi loads local plugins by requiring `strapi-server.js`.
// Our implementation is written in TypeScript, so this file must not `require('./server/...')`
// (Node cannot load `.ts` directly). When that happens, Strapi silently skips the plugin,
// which removes BOTH:
// - the sidebar menu link, and
// - the Roles -> Plugins permissions section.
//
// This wrapper registers a TS loader and forwards to `strapi-server.ts`.

let register;
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	({ register } = require('esbuild-register/dist/node'));
} catch (err) {
	// If this throws, Strapi may silently skip loading the plugin.
	// Try to resolve `esbuild-register` from the project root as a fallback
	try {
		const rootPath = require.resolve('esbuild-register/dist/node', { paths: [process.cwd()] });
		({ register } = require(rootPath));
		// eslint-disable-next-line no-console
		console.warn('⚠️ [AI YouTube] Loaded esbuild-register from project root fallback:', rootPath);
	} catch (err2) {
		// Emit an explicit message so we know why the server plugin isn't loaded.
		// eslint-disable-next-line no-console
		console.error(
			'❌ [AI YouTube] Failed to load esbuild-register. The plugin server will not load. ' +
				'Fix: run `npm install` in project root or in src/plugins/ai-youtube-article-plugin (and restart Strapi).',
			err,
			err2
		);
		throw err;
	}
}

const { unregister } = register({
	extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs'],
});

try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const plugin = require('./strapi-server.ts');
	module.exports = plugin?.default || plugin;
} finally {
	unregister();
}

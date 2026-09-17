import { defineConfig } from "vite"
import autoprefixer from "autoprefixer"

export default defineConfig({
	base: "/spin-the-weel/",
	server: {
		port: 5173,
	},
	preview: {
		port: 4173,
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
	css: {
		postcss: {
			plugins: [autoprefixer()],
		},
	},
})

import { defineConfig } from 'vite';
import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Keep the full source library available in development, while shipping only
// the assets referenced by the portfolio in the production artifact.
const publicAssets = [
    'myLogo.ico',
    'cv.md',
    ...['sofa', 'coffee-table', 'dining-table', 'chair', 'fridge', 'oven', 'sink', 'cabinet', 'kettle', 'mug', 'plant', 'clock', 'curtains', 'bed', 'toilet', 'bath-sink', 'shower', 'globe', 'books']
        .map(name => `lib/home/${name}.fbx`),
    'lib/space/spacebits_texture.png',
    'lib/space/License.txt',
    ...['lander_B', 'spacetruck', 'basemodule_A', 'lander_A', 'solarpanel', 'rocks_A', 'lights']
        .flatMap(name => ['gltf', 'bin'].map(ext => `lib/space/${name}.${ext}`)),
    ...['computerKeyboard', 'computerMouse', 'desk', 'computerScreen', 'chairDesk', 'lampRoundFloor', 'rocketFinsA', 'tree', 'sedanSports', 'laptop', 'chairModernCushion', 'bookcaseClosed', 'bookcaseClosedDoors', 'books']
        .map(name => `lib/asset_3d/${name}.glb`),
];

function copyPortfolioAssets() {
    let config;
    return {
        name: 'copy-portfolio-assets',
        apply: 'build',
        configResolved(resolved) { config = resolved; },
        async writeBundle() {
            const output = resolve(config.root, config.build.outDir);
            await Promise.all(publicAssets.map(async asset => {
                const destination = resolve(output, asset);
                await mkdir(dirname(destination), { recursive: true });
                await cp(resolve(config.publicDir, asset), destination);
            }));
        },
    };
}

export default defineConfig({
    base: './',
    plugins: [copyPortfolioAssets()],
    build: {
        copyPublicDir: false,
        rollupOptions: {
            output: {
                manualChunks: { three: ['three'] },
            },
        },
    },
});

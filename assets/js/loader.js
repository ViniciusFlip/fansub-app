 
const LOADER_MIN_TIME = 2000;

const startTime = Date.now();
const progress = document.getElementById('loader-progress');
const loader = document.getElementById('app-loader');

let current = 0;

const interval = setInterval(() => {
    if (!progress) return;

    current = Math.min(current + 2, 95);
    progress.style.width = `${current}%`;
}, 40);

window.addEventListener('load', () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, LOADER_MIN_TIME - elapsed);

    setTimeout(() => {
        clearInterval(interval);

        if (progress) {
            progress.style.width = '100%';
        }

        setTimeout(() => {
            if (!loader) return;

            loader.style.opacity = '0';

            setTimeout(() => loader.remove(), 300);
        }, 350);
    }, remaining);
});
 
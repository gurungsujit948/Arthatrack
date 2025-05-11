export function register() {
  // Skip service worker registration in development environments
  if (
    process.env.NODE_ENV === 'development' ||
    navigator.userAgent.includes('StackBlitz') ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    console.log('Service Worker registration skipped');
    return;
  }

  // Only proceed with registration in production environment
  if (process.env.NODE_ENV === 'production') {
    // Dynamically import workbox-window only when needed
    import('workbox-window').then(({ Workbox }) => {
      const wb = new Workbox('/sw.js');

      wb.addEventListener('installed', event => {
        if (event.isUpdate) {
          if (confirm('New version available! Reload to update?')) {
            window.location.reload();
          }
        }
      });

      wb.register().catch(error => {
        console.error('Service worker registration failed:', error);
      });
    }).catch(error => {
      console.error('Failed to load Workbox:', error);
    });
  }
}
// Apply the saved / system colour theme before first paint (external file keeps the CSP strict).
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('utsav:theme');
  } catch {
    theme = null;
  }
  if (theme !== 'dark' && theme !== 'light') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');

  // Web fonts load without blocking first paint (inline onload would violate the CSP).
  var fonts = document.getElementById('web-fonts');
  if (fonts) {
    fonts.addEventListener('load', function () {
      fonts.media = 'all';
    });
    if (fonts.sheet) fonts.media = 'all';
  }
})();

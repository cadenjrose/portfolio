// lightbox
(() => {
  const images = document.querySelectorAll('.tile-figure img');
  if (!images.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Enlarged image');
  dialog.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close">&times;</button><img alt="">';
  document.body.appendChild(dialog);

  const big = dialog.querySelector('img');

  const open = (img) => {
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    dialog.showModal();
  };

  images.forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge image: ' + img.alt);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  });

  // Any click inside the dialog (backdrop, image, or the X) closes it
  dialog.addEventListener('click', () => dialog.close());
})();
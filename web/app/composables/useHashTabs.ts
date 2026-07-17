export function useHashTabs() {
  function highlightCurrentLink() {
    // Get the current URL hash (e.g., "#section2")
    const currentHash = window.location.hash;

    // Remove 'active-link' class from any previously active links
    document.querySelectorAll('.tab-item-active').forEach((link) => {
      link.classList.remove('tab-item-active');
    });

    // Find the link whose href matches the current hash and add the class
    if (currentHash) {
      // Select links that point specifically to that hash
      const targetLink = document.querySelector(`a[href$="${currentHash}"]`);
      if (targetLink) {
        targetLink.classList.add('tab-item-active');
      }
    }
  }

  useEventListener(window, 'hashchange', highlightCurrentLink);
  onMounted(highlightCurrentLink);
}

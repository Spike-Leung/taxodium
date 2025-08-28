function copyFeedUrl() {
  try {
    navigator.clipboard.writeText(window.location.href).then(function() {
      const btn = document.querySelector('button[onclick*="copyFeedUrl"]');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '已复制！';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 500);
      }
    }, function(err) {
      console.error('复制失败:', err);
      fallbackCopy();
    });
  } catch (e) {
    fallbackCopy();
  }

  function fallbackCopy() {
    const textarea = document.createElement('textarea');
    textarea.value = window.location.href;
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      const btn = document.querySelector('button[onclick*="copyFeedUrl"]');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '已复制！';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 500);
      }
    } catch (err) {
      alert('复制失败，请手动复制地址栏链接');
    }
    document.body.removeChild(textarea);
  }
}

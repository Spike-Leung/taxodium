document.addEventListener("DOMContentLoaded", function () {
  const CodeHighlightedClass = "code-highlighted"

  function getCodeRefTarget(event) {
    let coderefElement = event.target

    /**
     * 有的时候 mouseover 的可能是 <a><code/></a> 中的 <code>，上面无法获取到 hash
     * 因此需要往上找到其父元素
     */
    while (coderefElement.className.indexOf('coderef') === -1) {
      coderefElement = coderefElement.parentNode
    }

    const id = coderefElement.hash.match(/#(.*)/)[1]
    const target = document.getElementById(id);

    return target
  }

  document.querySelectorAll(".coderef").forEach((coderef) => {
    coderef.addEventListener("mouseover", function codeHighlightOn(event) {
      const target = getCodeRefTarget(event)

      if (null != target) {
        target.classList.add(CodeHighlightedClass);
      }
    });

    coderef.addEventListener("mouseout", function codeHighlightOff(event) {
      const target = getCodeRefTarget(event)

      if (null != target) {
        target.classList.remove(CodeHighlightedClass);
      }
    });
  });
});

/**
 * ox-html 会给 .codedef 元素添加对应的 onmouseover、onmouseout 的函数，
 * 但是 onmouseover 和 onmouseout 因为 netlify CSP 限制无法执行，
 * 这里添加这个函数只是为了避免 onmouseover、onmouseout 报错
 */
function CodeHighlightOn() {}
function CodeHighlightOff() {}

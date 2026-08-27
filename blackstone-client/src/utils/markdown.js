// Minimal Markdown -> HTML renderer for blog post bodies. Deliberately not
// a full CommonMark implementation (and deliberately not an added npm
// dependency) — blog posts are written by one or two trusted people from
// the admin panel, not arbitrary user input, so this only needs to cover
// the small set of formatting a blog post actually uses: headings, bold/
// italic, links, images, blockquotes, lists, and paragraphs. Used by both
// AdminBlogPanel's live preview and the public BlogPost page, so what you
// see while writing is exactly what visitors see.
//
// Escapes raw HTML in the source FIRST, then layers real HTML tags on top
// via the patterns below — so a stray `<script>` typed into a post title or
// body renders as literal text instead of executing.
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Inline formatting — applied within a single line/paragraph, in a fixed
// order so e.g. a link's own text can still be bolded but a URL's own
// underscores never get misread as italics.
function renderInline(text) {
  return text
    // Images before links — ![alt](src) would otherwise partially match the
    // link pattern below (they share the (text)(url) shape).
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const isExternal = /^https?:\/\//.test(url)
      return `<a href="${url}"${isExternal ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function renderMarkdown(source) {
  const escaped = escapeHtml(String(source || ''))
  const lines = escaped.split(/\r?\n/)
  const html = []
  let listType = null // 'ul' | 'ol' | null — tracks an in-progress list across lines
  let paragraph = []

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }
  function closeList() {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      closeList()
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      closeList()
      html.push(`<blockquote>${renderInline(quote[1])}</blockquote>`)
      continue
    }

    const unordered = line.match(/^[-*]\s+(.*)$/)
    const ordered = line.match(/^\d+\.\s+(.*)$/)
    if (unordered || ordered) {
      flushParagraph()
      const kind = unordered ? 'ul' : 'ol'
      if (listType && listType !== kind) closeList()
      if (!listType) {
        listType = kind
        html.push(`<${kind}>`)
      }
      html.push(`<li>${renderInline((unordered || ordered)[1])}</li>`)
      continue
    }

    closeList()
    paragraph.push(line)
  }
  flushParagraph()
  closeList()

  return html.join('\n')
}

// A short, tag-free preview snippet — used where a post's excerpt hasn't
// been explicitly written, e.g. the admin list view.
export function markdownToPlainText(source, maxLength = 160) {
  const plain = String(source || '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#>*`_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain
}

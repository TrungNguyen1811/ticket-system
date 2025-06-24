export function generatePageButtons({
    page,
    totalPages,
    onPageChange,
  }: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }) {
    const pages: (number | "...")[] = []
  
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
  
      if (page > 3) {
        pages.push("...")
      }
  
      const startPage = Math.max(2, page - 1)
      const endPage = Math.min(totalPages - 1, page + 1)
  
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
  
      if (page < totalPages - 2) {
        pages.push("...")
      }
  
      pages.push(totalPages)
    }
  
    return pages.map((p, idx) =>
      p === "..." ? (
        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
          ...
        </span>
      ) : (
        <button
          key={p}
          className={`px-2 py-1 text-sm border rounded ${
            page === p ? "bg-primary text-white" : "bg-white"
          }`}
          onClick={() => onPageChange(p)}
          aria-current={page === p ? "page" : undefined}
        >
          {p}
        </button>
      )
    )
  }
  
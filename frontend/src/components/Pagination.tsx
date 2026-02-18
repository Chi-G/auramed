import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  onPageChange, 
  pageSize 
}: PaginationProps) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--background)]/50">
      <div className="text-sm text-[var(--muted)] font-medium">
        Showing <span className="font-bold text-[var(--foreground)]">{startItem}</span> to{' '}
        <span className="font-bold text-[var(--foreground)]">{endItem}</span> of{' '}
        <span className="font-bold text-[var(--foreground)]">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
                if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) {
                    pageNum = totalPages - 4 + i;
                }
            }
            
            // Adjust bounds if near end
            if (pageNum <= 0) pageNum = i + 1;

            return pageNum;
          }).filter((p, i, arr) => arr.indexOf(p) === i && p <= totalPages).map((page) => (
             <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                currentPage === page
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25 dark:shadow-sky-500/10'
                  : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

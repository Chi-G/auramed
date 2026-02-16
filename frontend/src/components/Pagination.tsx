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
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
      <div className="text-sm text-slate-500">
        Showing <span className="font-bold text-slate-700">{startItem}</span> to{' '}
        <span className="font-bold text-slate-700">{endItem}</span> of{' '}
        <span className="font-bold text-slate-700">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Simple logic to show pages around current page could be added here
            // For now just showing first 5 or logic can be improved.
            // Let's implement a smarter logic:
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
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                currentPage === page
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/25'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

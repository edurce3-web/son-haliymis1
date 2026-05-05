import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getFeaturedCategories } from '@/constants/categories';
import { cn } from '@/lib/utils';

const CategorySubHeader: React.FC = () => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const categories = getFeaturedCategories();



  useEffect(() => { setActiveId(null); }, [location.pathname]);

  const activeCategory = categories.find(c => c.id === activeId);

  return (
    <div className="relative z-40 bg-white border-b border-slate-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => {
            const isActive = activeId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveId(isActive ? null : cat.id);
                  navigate(`/courses/${cat.slug}`);
                }}
                className={cn(
                  'flex items-center px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory dropdown */}
      {activeCategory && (
        <>
          <div className="absolute left-0 right-0 top-full z-50 px-4 pb-3 animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="container mx-auto max-w-3xl">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{activeCategory.name}</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {activeCategory.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/courses/${activeCategory.slug}/${sub.slug}`}
                      onClick={() => setActiveId(null)}
                      className="px-3 py-2 rounded-xl text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors font-medium text-center"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setActiveId(null)} />
        </>
      )}
    </div>
  );
};

export default CategorySubHeader;

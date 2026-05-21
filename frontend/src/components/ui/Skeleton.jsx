const Skeleton = ({ className = '', variant = 'rect' }) => {
  const base = 'skeleton rounded-xl animate-pulse-soft';
  const variants = {
    rect: `${base} w-full h-4`,
    circle: `${base} rounded-full`,
    card: `${base} w-full h-48`,
    text: `${base} w-3/4 h-3`,
    avatar: `${base} w-12 h-12 rounded-full`,
  };
  return <div className={`${variants[variant]} ${className}`} />;
};

export const ListingCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
    <Skeleton variant="card" className="h-48" />
    <div className="p-4 space-y-3">
      <Skeleton className="w-1/3 h-5" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-2/3 h-3" />
      <div className="flex justify-between pt-2">
        <Skeleton className="w-1/4 h-6" />
        <Skeleton className="w-1/4 h-6" />
      </div>
    </div>
  </div>
);

export default Skeleton;

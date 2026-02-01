import React from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: string | number;
  renderItem: (index: number, item: T) => React.ReactNode;
  overscanCount?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  return (
    <div style={{ height, width, overflow: 'auto' }} className="border">
      {items.map((item, index) => (
        <div key={index} style={{ height: itemHeight }} className="border-b">
          {renderItem(index, item)}
        </div>
      ))}
    </div>
  );
}

/**
 * Hook to implement infinite scroll pagination
 * Tracks when user scrolls near the end and triggers callback to load more
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  isLoading: boolean,
  hasMore: boolean,
  threshold = 0.9
) {
  const handleScroll = ({ currentTarget }: { currentTarget: HTMLElement }) => {
    if (!isLoading && hasMore) {
      const { scrollTop, clientHeight, scrollHeight } = currentTarget;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      if (scrollPercentage > threshold) {
        onLoadMore();
      }
    }
  };

  return { handleScroll };
}

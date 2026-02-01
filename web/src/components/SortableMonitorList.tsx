import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Monitor {
  id: number;
  name: string;
  [key: string]: any;
}

function SortableMonitorItem({ monitor, children, ...props }: { monitor: Monitor; children: React.ReactNode; [key: string]: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: monitor.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Only apply listeners on the handle, not on the entire row
  const handlePointerDown = (e: React.PointerEvent) => {
    listeners?.onPointerDown?.(e as any);
  };

  return (
    <li 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      {...props} 
      className="group relative"
    >
      {children}
      {/* Small drag handle on the left side */}
      <div 
        onPointerDown={handlePointerDown}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 hover:w-2 cursor-grab active:cursor-grabbing transition-all opacity-0 group-hover:opacity-100"
        style={{ touchAction: 'none' }}
      />
    </li>
  );
}

interface SortableMonitorListProps {
  monitors: Monitor[];
  children: (monitor: Monitor) => React.ReactNode;
  onReorder: (monitors: Monitor[]) => void;
  useVirtualization?: boolean; // Enable virtualization for large lists
}

export function SortableMonitorList({ 
  monitors, 
  children, 
  onReorder,
  useVirtualization = monitors.length > 30, // Auto-enable for 30+ items
}: SortableMonitorListProps) {
  const [items, setItems] = useState(monitors);
  const [isSaving, setIsSaving] = useState(false);

  // Update items when monitors prop changes
  useEffect(() => {
    setItems(monitors);
  }, [monitors]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: any) {
    const { active, over } = event;

    if (over === null || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((m) => m.id === active.id);
    const newIndex = items.findIndex((m) => m.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onReorder(newItems);

    // Persist to backend
    const token = localStorage.getItem('token');
    try {
      setIsSaving(true);
      await axios.post('/api/monitors/reorder', { monitors: newItems }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error saving monitor order:', error);
      // Revert on error
      setItems(monitors);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((m) => m.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((m) => (
            <SortableMonitorItem key={m.id} monitor={m} className="cursor-grab active:cursor-grabbing">
              {children(m)}
            </SortableMonitorItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

const DragTest = () => {
  const [items, setItems] = useState([
    { id: 'item-1', content: '🍕 피자' },
    { id: 'item-2', content: '🍔 햄버거' },
    { id: 'item-3', content: '🍜 라면' },
  ]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [moved] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, moved);

    setItems(newItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ padding: 16, background: '#f4f4f4', width: 300, minHeight: 200 }}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      userSelect: 'none',
                      padding: 16,
                      margin: '0 0 8px 0',
                      background: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      ...provided.draggableProps.style,
                    }}
                  >
                    {item.content}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DragTest;

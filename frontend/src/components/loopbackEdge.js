import React from 'react';
import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

export default function LoopbackEdge(props) {

  const { sourceX, sourceY, targetX, targetY, markerEnd, data } = props;
  const radiusX = (sourceX - targetX) * 0.6;
  const radiusY = 50;
  const edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${
    targetX + 2
  } ${targetY}`;

  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} zIndex={1}/>
      {data && data.renderLabel && <EdgeLabelRenderer>
        <div 
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${centerX}px,${centerY}px)`,
            background: '#ddd',
            padding: 10,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 1
          }}
          className='nodrag nopan'
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>}
    </>
  );
}
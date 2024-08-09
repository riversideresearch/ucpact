import React from 'react';
import { getBezierPath, BaseEdge, useStore, EdgeLabelRenderer } from '@xyflow/react';
import './stateNode.css'

export const getSpecialPath = ({ sourceX, sourceY, targetX, targetY }, offset) => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  return [centerX, centerY + offset, `M ${sourceX} ${sourceY} Q ${centerX} ${centerY + offset} ${targetX} ${targetY}`];
};

export default function TransitionEdge({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  id,
  data
}) {

  const isBiDirectionEdge = useStore((s) => {
    const edgeExists = s.edges.some(
      (e) =>
        (data && e.source === target && e.target === source && e.sourceHandle === data.targetHandle && e.targetHandle === data.sourceHandle) 
      || (data && e.target === source && e.source === target && e.targetHandle === data.sourceHandle && e.sourceHandle === data.targetHandle)
    );

    return edgeExists;
  });

  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let path = edgePath;
  let labelXvar = labelX;
  let labelYvar = labelY;

  if (isBiDirectionEdge) {
    [labelXvar, labelYvar, path] = getSpecialPath(edgePathParams, sourceX < targetX ? 25 : -25);
  } else {
    [path] = getBezierPath(edgePathParams);
  }

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} color={'#000000'} />
      {data && data.renderLabel && <EdgeLabelRenderer>
        <div 
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelXvar}px,${labelYvar}px)`,
            background: '#ddd',
            padding: 10,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
          }}
          className='nodrag nopan'
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>}
    </>
  )
}
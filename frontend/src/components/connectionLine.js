import React from 'react';

function ConnectionLine ({ fromX, fromY, toX, toY }) {

  return (
    <g>
      <path
        fill="none"
        stroke={'black'}
        strokeWidth={4}
        className="solid"
        d={`M${fromX},${fromY} C ${fromX} ${toY} ${fromX} ${toY} ${toX},${toY}`}
        markerEnd="url('#1__color=#000000&height=14&type=arrowclosed&width=14')"
      />
    </g>
  );
};

export default ConnectionLine;
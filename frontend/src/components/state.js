import React from 'react';
import './state.css';
import { useDrag } from 'react-dnd';
import './stateMachines.css';
import { useSelector } from 'react-redux';

function State(props) {   

    // Redux selector for State Machine state
    const stateMachineSelector = useSelector((state) => state.stateMachines);
    const thisStateSelector = stateMachineSelector.states.find(element => element.id === props.id);

    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: "ucComp",
        item: { type: "state", id: props.id },
        canDrag: props.draggable,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), []);

    return (
        <div>
            <div id={props.id ? props.id : "stateCompBoxElem"} className="state"
                ref={dragRef}
                style={{ left: props.id ? props.disp.left + "px": "", top: props.id ? props.disp.top + "px": "", position: props.id ? "absolute" : "",
                opacity: isDragging ? 0.5 : 1, backgroundColor: props.id ? thisStateSelector.color: "#e3c85b"}}>
                <span>State</span>
            </div>
        </div>
    );
}

export default State;
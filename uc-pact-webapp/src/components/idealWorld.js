import React from 'react';
import { useDrop } from 'react-dnd';
import Environment from './environment';
import Simulator from './simulator';
import IdealFunc from './idealFunc';
import './idealWorld.css';

function IdealWorld(props) {

    // eslint-disable-next-line no-unused-vars
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ["ucComp", "simulator"],
        drop(item, monitor) {
            //addComponentToState(item.type)
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div className="ideal-world" ref={drop} >
            
            <header className="idwTitle">Ideal World</header>
            <Environment idPrefix="idealWorld" />
                <Simulator id={ "sim" } draggable={ false } /> 
                <IdealFunc id={ "idealfunc" } draggable={ false } /> 
        </div>
        
    );
}

export default IdealWorld

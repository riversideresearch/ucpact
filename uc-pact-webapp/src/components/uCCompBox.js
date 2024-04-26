import React from "react";
import  './uCCompBox.css'

function UCCompBox(props) {
    return (
        <div className="dB">
            <b> UC Components </b>
            <div className="component-holder">
                {props.children}
            </div>
        </div>
    );
}

export default UCCompBox

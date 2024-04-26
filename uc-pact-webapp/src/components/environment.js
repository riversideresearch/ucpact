import React from 'react';

import './environment.css'

function Environment(props) {
    return (
        <div id={props.idPrefix + "-environment"} className="env">
            <div id={props.idPrefix + "-environment-upper"} className="rectangleUpper">
                Environment
                <div id={props.idPrefix + "-environment-right"} className="rectangleRight">
                    <span className="advText">
                        Adversary
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Environment;   

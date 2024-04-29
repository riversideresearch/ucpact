/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import ModelApp from './modelApp';
import './loadingPage.css';

function LoadingPage(props) {
    const [timePassed, setTimePassed] = useState(false);
    const [renderApp, setRenderApp] = useState(false);
    let timerCount = Math.floor(Math.random() * 3000) + 1000

    const { setModelIsActive, show, setShow } = props;

    useEffect(() => {
        if (timePassed) {
            setRenderApp(true)
        } else {
            const timeoutId = setTimeout(() => {
                setTimePassed(true);
            }, timerCount);
            return () => clearTimeout(timeoutId);
        }
    }, [timePassed]);

    return (
        <div>
            {renderApp ? <ModelApp setModelIsActive={setModelIsActive} show={show} setShow={setShow}/> : 
        <div className='container'>
            <img src="/images/logo_blue-green-for-light-background.png" alt="logo" width="200" className="pulsating-image"/>
        </div>}
        </div>
    );
}

export default LoadingPage;

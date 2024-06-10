/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import './landingPage.css';
import { Link } from 'react-router-dom';
import { Button, Modal } from "react-bootstrap";
import axios from 'axios';
import { upperCaseValidation } from './helperFunctions';
import { useNavigate } from 'react-router';
import { ReactNotifications } from 'react-notifications-component';
import { Store } from "react-notifications-component";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "react-oidc-context";
import ModelList from './modelList';

function LandingPage(props) {

    const [apiData, setApiData] = useState();
    const [newModelName, setNewModelName] = useState("");
    const navigate = useNavigate();
    const auth = useAuth();

    const [modelData, setModelData] = useState();

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
	let urlPath = process.env.REACT_APP_SERVER_PREFIX;
    let token = "none";
    if (process.env.NODE_ENV !== 'test') {
        token = auth.user?.access_token;
    }
        axios({
            method: "GET",
            url: urlPath,
            headers: {
              Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
            }
        })
        .then((response) => {
            const res = response.data;
            setApiData(res);
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
        });
    }, []);

    const modelNameCheck = (e) => {
        e.preventDefault();
        if(upperCaseValidation(newModelName, true, " MODEL NOT CREATED")) {
            if(apiData && apiData.includes(newModelName)) {
                let notiMessage = "Message: Name of model already exists. MODEL NOT CREATED";
                let notiTitle = newModelName.concat(" Name Check Failure")
                let notiType = 'danger';
                let notification = {
                    title:   notiTitle,
                    message: notiMessage,
                    type:    notiType,
                    insert:  "top",
                    container: "top-right",
                    animationIn: ["animate__animated", "animate__fadeIn"],
                    animationOut: ["animate__animated", "animate__fadeOut"],
                    dismiss: {
                        duration: 10000,
                        onScreen: true
                    }
                };
                Store.addNotification(notification);   
            } else if (newModelName === '') {
                let notiMessage = "Message: Name of model cannot be blank. MODEL NOT CREATED";
                let notiTitle = newModelName.concat(" Name Check Failure")
                let notiType = 'danger';
                let notification = {
                    title:   notiTitle,
                    message: notiMessage,
                    type:    notiType,
                    insert:  "top",
                    container: "top-right",
                    animationIn: ["animate__animated", "animate__fadeIn"],
                    animationOut: ["animate__animated", "animate__fadeOut"],
                    dismiss: {
                        duration: 10000,
                        onScreen: true
                    }
                };
                Store.addNotification(notification); 
            } else if (/'/.test(newModelName)) {
                let notiMessage = "Message: Name of model cannot contain apostrophes. MODEL NOT CREATED";
                let notiTitle = newModelName.concat(" Name Check Failure")
                let notiType = 'danger';
                let notification = {
                    title:   notiTitle,
                    message: notiMessage,
                    type:    notiType,
                    insert:  "top",
                    container: "top-right",
                    animationIn: ["animate__animated", "animate__fadeIn"],
                    animationOut: ["animate__animated", "animate__fadeOut"],
                    dismiss: {
                        duration: 10000,
                        onScreen: true
                    }
                };
                Store.addNotification(notification);
            } else if (fileNameExists(newModelName)) {
                let notiMessage = "Message: Name of model is already in use MODEL NOT CREATED";
                let notiTitle = newModelName.concat(" Name Check Failure")
                let notiType = 'danger';
                let notification = {
                    title:   notiTitle,
                    message: notiMessage,
                    type:    notiType,
                    insert:  "top",
                    container: "top-right",
                    animationIn: ["animate__animated", "animate__fadeIn"],
                    animationOut: ["animate__animated", "animate__fadeOut"],
                    dismiss: {
                        duration: 10000,
                        onScreen: true
                    }
                };
                Store.addNotification(notification);
            } else {
                navigate("/new/" + newModelName);
            }
        }
    }
    const fileNameExists = (checkString) => {
        var exists = false;
        apiData.forEach((model) => {
            if(model['name'] === checkString){
                exists = true
            }
        });
        
        return exists
    }
    const deleteModel = (model) => {
        if (window.confirm("Are you sure you want to delete model \"" + model + "\"?")) {
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + model;
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            axios({
                method: "DELETE",
                url: urlPath,
                headers: {
                  Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                }
            })
            .then((response) => {
                let urlPath2 = process.env.REACT_APP_SERVER_PREFIX;
                axios({
                    method: "GET",
                    url: urlPath2,
                    headers: {
                      Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                    }
                })
                .then((response) => {
                    const res2 = response.data;
                    setApiData(res2);
                })
                .catch((err) => {
                    if (err.response) {
                        console.log(err.response);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                    }
                });
            })
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
            });
        }
    }
    const hideTabId = (model) => {
        if (!model['readOnly']) {
            return "";
        }
        let username = model['readOnly'].split('/')[0];
        return username;
    }
    const modelLink = (model) => {
        if (!model['readOnly']) {
            return <Link className='list-item' to={"/model/" + model['name']}>Model: {model['name']} <span className='writableText'> (Writable)</span></Link>;
        } else if (model['readOnly'] === 'CORRUPTED') {
            return <Link className='list-item'>Model: {model['name']} <span className='corruptedText'> (CORRUPTED)</span></Link>;
        } else {
            return <Link className='list-item' to={"/model/" + model['name']}>Model: {model['name']} <span className='readOnlyText'> {`(Read Only: ${hideTabId(model)})`}</span></Link>;
        }
    }

    useEffect(() => {
        if (apiData) {
            let modelsArray = apiData.sort((a, b) => b.lastModified - a.lastModified);
            modelsArray = modelsArray.filter((model) => model.readOnly === '');
            setModelData(modelsArray.slice(0, 5))
        }
    }, [apiData]);

    return (
        <div>
            <div className='container'>
                <ReactNotifications />
                <div className='item'>
                    <div><img src="/images/logo_blue-green-for-light-background.png" alt="logo" width="400"/></div>
                </div>
                <div className='item inner-flex'>
                    <div className='inner-item list'>                
                        <input type='text' className='new-model-name form-control form-control-15' 
                            placeholder='New Model Name' defaultValue={newModelName} onChange={(e) => setNewModelName(e.target.value)}/>
                        <button className='btn btn-primary' onClick={modelNameCheck}>New Model...</button>
                    </div>
                    <div className='inner-item list'><button className='btn btn-primary' onClick={handleShow}>All Models...</button></div>
                    <div className='inner-item list'>
                        <div className='list-item'>Recent Models:</div>
                        {modelData && (
                        modelData.map(model => (
                            <div key={model['name']}>
                                <FontAwesomeIcon icon={faTrash} className='interfaceDel' title="Delete Model" onClick={() => deleteModel(model['name'])} />
                                {modelLink(model)}
                            </div>
                        )))}  
                    </div>
                </div>
            </div>
            <Modal show={show} onHide={handleClose} animation={false} className="modelListModal">
                <Modal.Header> 
                    <Modal.Title>All Models</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ModelList/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default LandingPage;

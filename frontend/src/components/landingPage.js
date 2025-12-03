/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import './landingPage.css';
import { Link } from 'react-router-dom';
import { Button, Modal } from "react-bootstrap";
import axios from 'axios';
import { upperCaseValidation } from './helperFunctions';
import { useNavigate } from 'react-router';
import { ReactNotifications } from 'react-notifications-component';
import { Store } from "react-notifications-component";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFileArrowDown } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "react-oidc-context";
import ModelList from './modelList';
import {useDropzone} from 'react-dropzone'

function LandingPage(props) {

    const [apiData, setApiData] = useState();
    const [files, setFiles] = useState(null);
    const [newModelName, setNewModelName] = useState("");
    const navigate = useNavigate();
    const auth = useAuth();

    const [modelData, setModelData] = useState();

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [showImport, setShowImport] = useState(false);
    const handleCloseImport = () => setShowImport(false);
    const handleShowImport = () => setShowImport(true);

    useEffect(() => {
	let urlPath = process.env.REACT_APP_SERVER_PREFIX;
    let token = "none";
    if ((process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE')) {
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
    }, [show]);

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
    const downloadModel = (model) => {
        let urlPath = `${process.env.REACT_APP_SERVER_PREFIX}/export/${model}`;
        let token = "none";
        if (process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE') {
            token = auth.user?.access_token;
        }
        axios({
            method: "GET",
            url: urlPath,
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
        .then((response) => {
            const blob = new Blob([JSON.stringify(response.data)], {type: "application/json"});
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = model + ".json";
            link.click();
            window.URL.revokeObjectURL(url);
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
        })
    }
    const deleteModel = (model) => {
        if (window.confirm("Are you sure you want to delete model \"" + model + "\"?")) {
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + model;
            let token = "none";
            if ((process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE')) {
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
                if (response.status === 204) {
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
                }
            })
            .catch((err) => {
                if (err.response && err.response.status === 403) {
                    let notiMessage = `Warning: ${model} is in ReadOnly mode; cannot delete!`;
                    window.alert(notiMessage);
                } else if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
            });
        }
    }
    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles)
      }, [])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept: {'application/json': ['.json']}})

    const saveImportInfo = (e) => {
        e.preventDefault();
        files.forEach(file => {
            let urlPath = `${process.env.REACT_APP_SERVER_PREFIX}/import/${file.name}`;
            let token = "none";
            if (process.env.NODE_ENV !== 'test' && process.env.REACT_APP_AUTH_DISABLED !== 'TRUE') {
                token = auth.user?.access_token;
            }
            var bodyFormData = new FormData();
            bodyFormData.append(file.name, file);
            axios({
                method: "POST",
                url: urlPath,
                headers: {
                    Authorization: `Bearer ${token}`,
                    SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                    "Content-type": "multipart/form-data",
                },
                data: bodyFormData
            })
            .then((response) => {
                if (response.status === 201) {
                    const res = response.data;
                    const metadata = res["meta"];
                    if (metadata.original.model_name !== metadata.new.model_name) {
                        let notiMessage = `Timestamp (in UTC) added/updated! New name: ${metadata.new.model_name}`;
                        window.alert(notiMessage)
                    }
                }
                setShowImport(false);
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
                let notiType = 'danger';
                let notification = {
                    title: "",
                    message: "",
                    type: notiType,
                    insert:  "top",
                    container: "top-right",
                    animationIn: ["animate__animated", "animate__fadeIn"],
                    animationOut: ["animate__animated", "animate__fadeOut"],
                    dismiss: {
                        duration: 10000,
                        onScreen: true
                    }
                };
                if (err.response && err.response.status === 500) {
                    // Corrupted JSON file
                    notification.message = "Message: Can't import model; JSON file is corrupted!";
                    notification.title = file.name +" Corrupted JSON File";
                } else if (err.response && err.response.status === 400) {
                    // Invalid model name
                    notification.message = "Message: Model could not be imported due to an invalid name!";
                    notification.title = file.name +" Invalid Model Name";
                }
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                    if (notification.message && notification.title) {
                        Store.addNotification(notification);
                    }
                }
            })
        })
        
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
                        <button
                            className='btn btn-primary'
                            onClick={handleShowImport}
                            style={{marginTop: '5px'}}
                        >Import Model JSON...
                        </button>
                    </div>
                    <div className='inner-item list'><button className='btn btn-primary' onClick={handleShow}>All Models...</button></div>
                    <div className='inner-item list'>
                        <div className='list-item'>Recent Models:</div>
                        {modelData && (
                        modelData.map(model => (
                            <div key={model['name']}>
                                <FontAwesomeIcon icon={faTrash} className='interfaceDel' title="Delete Model" onClick={() => deleteModel(model['name'])} />
                                <FontAwesomeIcon icon={faFileArrowDown} className='interfaceDel' title='Download Model' onClick={() => downloadModel(model['name'])} />
                                {modelLink(model)}
                            </div>
                        )))}
                    </div>
                </div>
            </div>
            <Modal show={showImport} onHide={handleCloseImport} animation={false} data-testid="import-modal">
                <Modal.Header>
                    <Modal.Title>Import a Model JSON File</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div {...getRootProps()} className='dropService'>
                        <input {...getInputProps()}/>
                        {
                            isDragActive ?
                            <h2>Drag the Files Here</h2>
                            :<h2> Drag and Drop files here, or click to select some files</h2>  
                        }
                    </div>
                    <br></br>
                    <div className='filesLoaded'>
                        {files ? <h3> Files are currently loaded </h3> : <h3> No files are currently loaded </h3>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={saveImportInfo}>Save Changes</Button>
                    <Button variant="secondary" onClick={handleCloseImport}>Close</Button>
                </Modal.Footer>
            </Modal>
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

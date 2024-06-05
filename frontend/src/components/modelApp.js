/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import 'bootstrap/dist/css/bootstrap.css';
import IdealWorld from './idealWorld';
import RealFunctionality from './realFunctionality';
import UCCompBox from './uCCompBox';
import Party from './party';
import SubFunc from './subFunc';
import ParameterInterface from './parameterInterface';
import Interfaces from './interfaces';
import CodeGenerator from './codeGenerator';
import StateMachines from './stateMachines';
import './modelApp.css'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Xwrapper, useXarrow } from 'react-xarrows';
import { ReactNotifications } from 'react-notifications-component';
import 'react-notifications-component/dist/theme.css'
import { useParams, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { interfacesAppLoadDispatch } from '../features/interfaces/interfacesSlice';
import { partiesAppLoadDispatch } from '../features/parties/partiesSlice';
import { subfunctionalitiesAppLoadDispatch } from '../features/subfunctionalities/subfuncSlice';
import { realFuncAppLoadDispatch } from '../features/realFunctionalities/realFuncSlice';
import { simAppLoadDispatch } from '../features/simulators/simulatorSlice';
import { idealFuncAppLoadDispatch } from '../features/idealFunctionalities/idealFuncSlice';
import { stateMachineAppLoadDispatch } from '../features/stateMachines/stateMachineSlice';
import { changeModelNameDispatch, modelAppLoadDispatch } from '../features/model/modelSlice';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear, faHouse } from '@fortawesome/free-solid-svg-icons'
import uuid from 'react-uuid';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { changeModelReadOnlyDispatch } from '../features/model/modelSlice';
import { Button, Modal, Form } from "react-bootstrap";
import './modelApp.css';
import { upperCaseValidation } from './helperFunctions';
import { Store } from "react-notifications-component";
import { useAuth } from "react-oidc-context";

var modelName = "";
var popupTimeout;
var timerTimeout;

function ModelApp(props) {
    const updateXarrow = useXarrow();
    const dispatch = useDispatch();
    const [isDone, setIsDone] = useState(false);
    const [subFuncMessages, setSubFuncMessages] = useState([]); // State used for subfunc messages in State Machines
    const [paramInterMessages, setParamInterMessages] = useState([]); // State used for parameter interface messages in State Machines

    const subfuncSelector = useSelector(state => state.subfunctionalities);
    const realFuncSelector = useSelector(state => state.realFunctionality);
    const modelSelector = useSelector(state => state.model);
    const reduxSelector = useSelector(state => state);

    const handleModelModalClose = () => setModelModalShow(false);

    const { setModelIsActive, show: modelModalShow, setShow: setModelModalShow } = props;

    const { id, name } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();

    library.add(faGear);
    library.add(faHouse);

    const [show, setShow] = useState(false);

    useEffect(() => {
        let titleReadOnly;
        if (modelSelector.readOnly) {
            titleReadOnly = "Read Only";
        } else {
            titleReadOnly = "Writable";
        }
        document.title = "UC-PACT | " + modelSelector.name + " (" + titleReadOnly + ")";
    }, [modelSelector]);

    useEffect(() => { // activate the timer on first run
        timerTimeout = setTimeout(() => showTimerPopup(), 2700000) // timeout after 45 minutes of inactivity
    }, [])

    const restartTimer = () => {
        if (timerTimeout) {
            clearTimeout(timerTimeout);
        }

        if (popupTimeout) {
            clearTimeout(popupTimeout);
        }

        timerTimeout = setTimeout(() => showTimerPopup(), 2700000)
    }

    const showTimerPopup = () => { // triggers the popup if the user hasn't edited in time
        if (!modelSelector.readOnly) {
            setShow(true)
            popupTimeout = setTimeout(() => handleReturnModel(), 900000); // popup will return model automatically after 15 minutes
        }
    }

    const handleReturnModel = () => {
        if (!modelSelector.readOnly) {
            changeModelReadOnlyDispatch("");
            
            let reduxData = {...reduxSelector}
            delete reduxData["model"];
            
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/return/" + modelSelector.name;
        
            axios({
                method: "PUT",
                url: urlPath,
                headers: {
                  Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                },
                data: {
                    ...reduxData,
                    ...modelSelector
                }
            })
            .then(_ => {})
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
            })
            .finally(() => {
                setShow(false)
                clearTimeout(timerTimeout)
                window.location.assign("/"); // clear Redux store and navigate to landing page
            });
        }
    }

    const handleClose = () => {
        setShow(false);
        restartTimer()
    }

    const modelNameRef = React.createRef();

    // Runs on the transition from the landing page. Either will do a GET or a POST
    useEffect(() => {
        if (id) {
            // Load existing model
        let token = "none";
        if (process.env.NODE_ENV !== 'test') {
            token = auth.user?.access_token;
        }
	    let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + id;
            axios({
                method: "GET",
                url: urlPath,
                headers: {
                  Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                }
            })
            .then((response) => {
                const res = response.data

                // Push to redux
                // model
                let modelInfo = {
                    "id" : res["id"],
                    "name" : res["name"],
                    "readOnly" : res["readOnly"]
                }
                dispatch(modelAppLoadDispatch(modelInfo));
                // interfaces
                dispatch(interfacesAppLoadDispatch(res["interfaces"]));
                // parties
                dispatch(partiesAppLoadDispatch(res["parties"]));
                // subfunctionalities
                dispatch(subfunctionalitiesAppLoadDispatch(res["subfunctionalities"]));
                // realFunctionality
                dispatch(realFuncAppLoadDispatch(res["realFunctionality"]));
                // simulator
                dispatch(simAppLoadDispatch(res["simulator"]));
                // idealFunctionality
                dispatch(idealFuncAppLoadDispatch(res["idealFunctionality"]));
                // stateMachines
                dispatch(stateMachineAppLoadDispatch(res["stateMachines"]));

                setIsDone(true);
                setModelIsActive(true);
            })
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
                if (err.response.status === 404) {
                    let notiMessage = "Message: Model not found on server. Name of model may have been changed. You will now be directed to the homepage...";
                    let notiTitle = "Model Not Found"
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
                    setTimeout(() => {
                        window.location.assign("/")
                    }, 2000);
                } else if (err.response.status === 500) {
                    let notiMessage = "Can't refresh: Model JSON file is corrupted!";
                    let notiTitle = "Model Corrupted"
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
                    setTimeout(() => {
                        window.location.assign("/")
                    }, 5000);
                }
            });

        } else if (name) {
            // Create a new model
            let newModel = {
                "id" : uuid(),
                "name" : name,
                "readOnly" : false,
            }

            // initialStates
            let idealFuncInitStateID = uuid();
            let simInitStateID = uuid();
            
            // stateMachines
            let idealFuncSMID = uuid();
            let simSMID = uuid();

            let stateMachines = {
                "stateMachines" : [
                    {
                        "id" : idealFuncSMID,
                        "states" : [idealFuncInitStateID],
                        "transitions" : [],
                        "initState" : idealFuncInitStateID
                    },
                    {
                        "id" : simSMID,
                        "states" : [simInitStateID],
                        "transitions" : [],
                        "initState" : simInitStateID
                    }
                ],
                "states" : [
                    {
                        "id" : idealFuncInitStateID,
                        "name" : "InitState",
                        "left" : 270,
                        "top" : 150,
                        "color" : "#e3c85b",
                        "parameters" : [],
                    },
                    {
                        "id" : simInitStateID,
                        "name" : "InitState",
                        "left" : 270,
                        "top" : 150,
                        "color" : "#e3c85b",
                        "parameters" : [],
                    }
                ],
                "transitions" : []
            };

            // idealFunctionality
            let idealFunc = {
                "id" : uuid(),
                "name": "IF",
                "basicAdversarialInterface": "",
                "compositeDirectInterface": "",
                "stateMachine": idealFuncSMID,
                "color": "#3e88c7",
                "left": 250,
                "top": 250
            };

            // simulator
            let sim = {
                "id": uuid(),
                "name": "Sim",
                "basicAdversarialInterface": "",
                "realFunctionality": "",
                "stateMachine": simSMID,
                "color": "#6bb45c",
                "left": 450,
                "top": 201
            };

            let realFunc = {
                "parties": [],
                "subfunctionalities": [],
                "id": uuid(),
                "name": "Real_Functionality",
                "compositeDirectInterface": "",
                "compositeAdversarialInterface": "",
                "parameterInterfaces": [],
            };

            modelName = name;
            dispatch(modelAppLoadDispatch(newModel));
            dispatch(modelAppLoadDispatch(newModel));
            dispatch(stateMachineAppLoadDispatch(stateMachines));
            dispatch(idealFuncAppLoadDispatch(idealFunc));
            dispatch(simAppLoadDispatch(sim));
            dispatch(realFuncAppLoadDispatch(realFunc));
            
            
            let redirectPath = "/model/" + modelName;
            navigate(redirectPath);

            let reduxData = {...reduxSelector}
            delete reduxData["model"];
            
            // Creates the POST message after the redux store is initially set
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + modelName;
            axios({
                method: "POST",
                url: urlPath,
                headers: {
                  Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                },
                data: {
                    ...reduxData,
                    ...modelSelector
                }
            })
            .then(_ => {})
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
            })
            .finally(() => {
                // Tells that the process is complete and the POST message is sent
                setIsDone(true);
                setModelIsActive(true);
            })
        }
    }, []);

    // This is set to watch the store for changes and send those changes to the backend
    useEffect(() => {
        let modelPath = "";

        if (id) {
            modelPath = id;
        } else if (modelName) {
            modelPath = modelName;
        }

        let reduxData = {...reduxSelector}
        delete reduxData["model"];

        if (!modelSelector.readOnly) {
            // Updates the Backend through the PUT method on a redux store change
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + modelPath;
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            axios({
                method: "PUT",
                url: urlPath,
                headers: {
                Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                },
                data: {
                    ...reduxData,
                    ...modelSelector
                }
            })
            .then(_ => {})
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                    if (err.response.status === 500) {
                        setIsDone(false)
                        setModelIsActive(false)
                        window.location.assign("/");
                    }
                }
            })
            .finally(() => {                
                restartTimer()
            });
        }

    },[reduxSelector]);

    // Api call for subfunc messages
    useEffect(() => {
        // Clear subFuncMessages
        setSubFuncMessages([]);
        // Get all subfuncs
        subfuncSelector.subfunctionalities.forEach((subfunc) => {
            if (subfunc.idealFunctionalityId) {
                // Make api call
                let token = "none";
                if (process.env.NODE_ENV !== 'test') {
                    token = auth.user?.access_token;
                }
                let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/idealFunctionalities/" + subfunc.idealFunctionalityId + "/messages";
                axios({
                    method: "GET",
                    url: urlPath,
                    headers: {
                      Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                    },
                })
                .then((response) => {
                    const res = response.data;
                    res.forEach(message => {
                        message["subfuncId"] = subfunc.id;
                        message["id"] += "/" + subfunc.id;
                    });
                    setSubFuncMessages(subFuncMessages => [...subFuncMessages, ...res])
                })
                .catch((err) => {
                    if (err.response) {
                        console.log(err.response);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                    }
                });
            }
        });
    }, [subfuncSelector]);

    // Api call for param interfaces messages
    useEffect(() => {
        // Clear paramInters
        setParamInterMessages([]);
        // Check if this state machine is for a party
        if (realFuncSelector.parameterInterfaces) {
            // Get all paramInterfaces
            realFuncSelector.parameterInterfaces.forEach((paramInter) => {
                if (paramInter.idOfInterface) {
                    // Make api call
                    let token = "none";
                    if (process.env.NODE_ENV !== 'test') {
                        token = auth.user?.access_token;
                    }
                    let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/compInterfaces/" + paramInter.idOfInterface + "/messages";
                    axios({
                        method: "GET",
                        url: urlPath,
                        headers: {
                          Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                        },
                    })
                    .then((response) => {
                        const res = response.data;
                        res.forEach(message => {
                            message["paramInterId"] = paramInter.id;
                            message["id"] += "/" + paramInter.id;
                        });
                        setParamInterMessages(paramInterMessages => [...paramInterMessages, ...res])
                    })
                    .catch((err) => {
                        if (err.response) {
                            console.log(err.response);
                            console.log(err.response.status);
                            console.log(err.response.headers);
                        }
                    });
                }
            });
        }
    }, [realFuncSelector]);

    const refreshModelStatus = () => {
        let token = "none";
        if (process.env.NODE_ENV !== 'test') {
            token = auth.user?.access_token;
        }
        let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + id;
        axios({
            method: "GET",
            url: urlPath,
            headers: {
              Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
            },
        })
        .then((response) => {
            const res = response.data
            if (res["readOnly"]) {
                if(window.confirm("Model is locked. Would you like to load recent changes? (WARNING: You will lose all changes made in Read Only mode.)")) {
                    setIsDone(false);
                    setModelIsActive(false);
                    window.location.reload();
                }
            } else {
                if (window.confirm("Model is unlocked. Would you like to reload it as writable?")) {
                    setIsDone(false)
                    setModelIsActive(false)
                    let token = "none";
                    if (process.env.NODE_ENV !== 'test') {
                        token = auth.user?.access_token;
                    }
                    let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/return/" + res["name"];
            
                    axios({
                        method: "PUT",
                        url: urlPath,
                        headers: {
                          Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                        },
                        data: {
                            ...res
                        }
                    })
                    .then(_ => {})
                    .catch((err) => {
                        if (err.response) {
                            console.log(err.response);
                            console.log(err.response.status);
                            console.log(err.response.headers);
                        }
                    })
                    .finally(() => {
                        window.location.reload();
                    });
                }
            }
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
            if (err.response.status === 404) {
                let notiMessage = "Message: Model not found on server. Name of model may have been changed. You will now be directed to the homepage...";
                let notiTitle = "Model Not Found"
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
                setTimeout(() => {
                    window.location.assign("/")
                }, 5000);
            } else if (err.response.status === 500) {
                let notiMessage = "Can't refresh: Model JSON file is corrupted!";
                let notiTitle = "Model Corrupted"
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
                setTimeout(() => {
                    window.location.assign("/")
                }, 5000);
            }
        });
    }

    const returnModel = () => {
        if (!modelSelector.readOnly) {
            if (window.confirm("Are you sure you want to return this model? This will close the model, and you will no longer be able to make changes.")) {
                let reduxData = {...reduxSelector}
                delete reduxData["model"];
                let token = "none";
                if (process.env.NODE_ENV !== 'test') {
                    token = auth.user?.access_token;
                }
                let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/return/" + modelSelector.name;
        
                axios({
                    method: "PUT",
                    url: urlPath,
                    headers: {
                      Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                    },
                    data: {
                    ...reduxData,
                    ...modelSelector
                    }
                })
                .then(_ => {})
                .catch((err) => {
                    if (err.response) {
                        console.log(err.response);
                        console.log(err.response.status);
                        console.log(err.response.headers);
                    }
                })
                .finally(() => {
                    setIsDone(false)
                    setModelIsActive(false)
                    setModelModalShow(false)
                    window.location.assign("/");
                });
            }
        }
    }

    const homeLink = (e) => {
        setModelIsActive(false)
        setIsDone(false)

        if (!modelSelector.readOnly) {
            let reduxData = {...reduxSelector}
            delete reduxData["model"];
            let token = "none";
            if (process.env.NODE_ENV !== 'test') {
                token = auth.user?.access_token;
            }
            let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/return/" + modelSelector.name;

            axios({
                method: "PUT",
                url: urlPath,
                headers: {
                  Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                },
                data: {
                ...reduxData,
                ...modelSelector
                }
            })
            .then(_ => {})
            .catch((err) => {
                if (err.response) {
                    console.log(err.response);
                    console.log(err.response.status);
                    console.log(err.response.headers);
                }
            })
            .finally(() => {
                window.location.assign("/");
            });
        } else {
            window.location.assign("/");
        }
    }

    const saveComponentInfo = (e) => {
        e.preventDefault();
        let urlPath = process.env.REACT_APP_SERVER_PREFIX;
        let token = "none";
        let newModelName = modelNameRef.current.value
        if (process.env.NODE_ENV !== 'test') {
            token = auth.user?.access_token;
        }
        var fileDoesNotExist = true
        axios({
            method: "GET",
            url: urlPath,
            headers: {
                Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
            }
        })
        .then((response) => {
            const res = response.data;
            res.forEach((model) => {
                if(model['name'] === newModelName){
                    fileDoesNotExist = false
                }
            });
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
        })
        .finally(() => {
            if(!fileDoesNotExist){
                let notiMessage = "Message: Name of model is already in use MODEL NAME NOT UPDATED";
                let notiTitle = newModelName +" Name Check Failure"
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
            }
            if (upperCaseValidation(modelNameRef.current.value) && fileDoesNotExist) {
                dispatch(changeModelNameDispatch(newModelName));

                let modelPath = "";

                if (id) {
                    modelPath = id;
                } else if (modelName) {
                    modelPath = modelName;
                }
                
                let reduxData = {...reduxSelector}
                delete reduxData["model"];

                if (!modelSelector.readOnly) {
                    // Updates the Backend through the PUT method on a redux store change

                    let token = "none";
                    if (process.env.NODE_ENV !== 'test') {
                        token = auth.user?.access_token;
                    }
                    let urlPath = process.env.REACT_APP_SERVER_PREFIX + "/" + modelPath;
                    axios({
                        method: "PUT",
                        url: urlPath,
                        headers: {
                        Authorization: `Bearer ${token}`, SessionTabId: `${localStorage.sessionID}/${sessionStorage.tabID}`,
                        },
                        data: {
                            ...reduxData,
                            ...modelSelector
                        }
                    })
                    .then(_ => {
                        navigate("/model/" + newModelName);
                        setModelModalShow(false);
                    })
                    .catch((err) => {
                        if (err.response) {
                            console.log(err.response);
                            console.log(err.response.status);
                            console.log(err.response.headers);
                            if (err.response.status === 500) {
                                setIsDone(false)
                                setModelIsActive(false)
                                window.location.assign("/");
                            }
                        }
                    });
                }        
            }
        });
    }

    return (
        <DndProvider backend={HTML5Backend}>
        <ReactNotifications />
        <Xwrapper>
            {isDone && (
            <div>                
                <Tabs
                    defaultActiveKey="rWorld"
                    onSelect={(k) => {
                    // need to update the arrows
                    updateXarrow();
                    }}
                >
                    <div title={<Link to="/"><img src="/images/favicon.ico" alt="logo" width="30" onClick={e => homeLink(e)}/></Link>}></div>
                    <Tab eventKey="rWorld" title="Real World" className="rwTab">
                        <UCCompBox>
                            <SubFunc />
                            <Party paramInterMessages={paramInterMessages}/>
                            <ParameterInterface />
                        </UCCompBox>
                        <RealFunctionality />
                    </Tab>
                    <Tab eventKey="idWorld" title="Ideal World">
                        <IdealWorld />
                    </Tab>
                    <Tab eventKey="interfaces" title="Interfaces">
                        <Interfaces />
                    </Tab>
                    <Tab eventKey="stateMachines" title="State Machines" className="smTab">
                        <StateMachines subFuncMessages={subFuncMessages} paramInterMessages={paramInterMessages}/>
                    </Tab>
                    <Tab eventKey="aceEditor" title="Code">
                        <CodeGenerator subFuncMessages={subFuncMessages} paramInterMessages={paramInterMessages}/>
                    </Tab>
                </Tabs>
                <Modal show={modelModalShow} onHide={handleModelModalClose} animation={false} data-testid="model-modal">
                    <Modal.Header> 
                        <Modal.Title> Configure { modelSelector.name || "Model"} <span className={modelSelector.readOnly ? "readOnlyText" : "writableText"}>{modelSelector.readOnly ? "(Read Only)" : "(Writable)"}</span></Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="modelNameComponent">
                            <Form>
                                <Form.Control name="modelNameComp" type="text" 
                                    placeholder="Enter a name" size="15"
                                    defaultValue={ modelSelector.name } ref={modelNameRef}
                                    autoFocus />
                            </Form>
                            {modelSelector.readOnly ? (
                                <button className='refreshBtn btn btn-info' onClick={refreshModelStatus}>Refresh Status</button>
                            ) : 
                            (
                                <button className='refreshBtn btn btn-warning' onClick={returnModel}>Return Model</button>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={saveComponentInfo}> Save Changes </Button>
                        <Button variant="secondary" onClick={handleModelModalClose}> Close </Button>
                    </Modal.Footer>
                </Modal>
                <Modal show={show} animation={false} onHide={handleClose}>
                    <Modal.Header> 
                        <Modal.Title> ALERT </Modal.Title>
                    </Modal.Header>                
                    <Modal.Body>
                        <div>
                            Due to inactivity, your model is about to be returned so others can edit it. Choose whether to cancel or confirm this action below.
                            Failure to do so in the next 15 minutes will result in your model being returned.
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={handleReturnModel} className="returnModelConfirm">Confirm Return</Button>
                        <Button variant="secondary" onClick={handleClose} className="cancelModelReturn">Cancel</Button>            
                    </Modal.Footer> 
                </Modal>
            </div>
            )}
        </Xwrapper>
        </DndProvider>
    );
}

export default ModelApp;

/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from 'react';
import Select from "react-select";
import "./interpreter.css"
import axios from 'axios';
import { useAuth } from "react-oidc-context";
import { Button, Modal, Col, Row } from 'react-bootstrap';
import { FileUploader } from "react-drag-drop-files"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlusCircle, faFileArrowDown, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import Xarrow from 'react-xarrows';

function ArrowModal(props) {
    const {
        diffInfo: messageDiffInfo,
        selIdx: selMessageIdx,
        showModal: showArrowModal,
        setShowModal: setShowArrowModal,
        setupModal: updateModalData,
        rawMessageData,
        messageContentMatches,
        messageStatus,
    } = props;

    const handleArrowModalClose = () => setShowArrowModal(false);

    const getParamList = (listType) => {
        let items = [];
        switch (listType) {
            case 'realArgs': {
                let realArgs = messageDiffInfo.paramArgs[selMessageIdx].real;
                if (!realArgs.length) {
                    return <>Real has no parameters.</>
                }
                items = realArgs.map((paramArg, idx) => {
                    let itemId = `realArgs-${idx}`;
                    return (
                        <li key={itemId}>
                            {paramArg}
                        </li>
                    );
                });
                break
            } default: {
                // listType === idealArgs
                let idealArgs = messageDiffInfo.paramArgs[selMessageIdx].ideal;
                if (!idealArgs.length) {
                    return <>Ideal has no parameters.</>;
                }
                items = idealArgs.map((paramArg, idx) => {
                    let itemId = `idealArgs-${idx}`;
                    return (
                        <li key={itemId}>
                            {paramArg}
                        </li>
                    );
                });
                break
            }
        }
        return (
            <ol>
                {items}
            </ol>
        )
    };
    return (
        <Modal show={showArrowModal} onHide={handleArrowModalClose} onShow={updateModalData}
         animation={false} className="arrowModal" data-testid="message-modal">
            <Modal.Header>
                <Modal.Title>
                    {showArrowModal && <div className='arrowModalTitle'>
                        {rawMessageData.type === "message" ? rawMessageData.name : (
                            rawMessageData.type === "error" ? "<Error>" : "<Fail>"
                        )}
                        <br/>
                        {rawMessageData.type === "message" && rawMessageData.mismatched ? messageStatus : (
                            rawMessageData.type === "error" ? rawMessageData.name : ""
                        )}
                    </div>}
                </Modal.Title>
            </Modal.Header>
            {showArrowModal && rawMessageData.type === "message" && <Modal.Body className='arrowModalBody'>
                <div className='portsDiff'>
                    <div className='portsBox' style={{
                            color: (messageContentMatches.ports ? 'black' : 'red'),
                            "backgroundcolor": (
                                messageContentMatches.ports ?
                                'white' : 'rgb(255, 196, 48)'
                            )
                        }}>
                        <h3>Real Ports:</h3>
                        From: {messageDiffInfo.fromPorts[selMessageIdx].real}<br/>
                        To: {messageDiffInfo.toPorts[selMessageIdx].real}
                    </div>
                    <div className='portsBox' style={{
                            color: (messageContentMatches.ports ? 'black' : 'red'),
                            "backgroundcolor": (
                                messageContentMatches.ports ?
                                'white' : 'rgb(255, 196, 48)'
                            )
                        }}>
                        <h3>Ideal Ports:</h3>
                        From: {messageDiffInfo.fromPorts[selMessageIdx].ideal}<br/>
                        To: {messageDiffInfo.toPorts[selMessageIdx].ideal}
                    </div>
                </div>
                <div className='parameterDisplay'>
                    <div className='parameterBox' style={{
                            color: (messageContentMatches.params ? 'black' : 'red'),
                            "backgroundcolor": (
                                messageContentMatches.params ?
                                'white' : 'rgb(255, 196, 48)'
                            )
                        }}>
                        <h4>Real World Arguments:</h4>
                        {getParamList('realArgs')}
                    </div>
                    <div className='parameterBox' style={{
                            color: (messageContentMatches.params ? 'black' : 'red'),
                            "backgroundcolor": (
                                messageContentMatches.params ?
                                'white' : 'rgb(255, 196, 48)'
                            )
                        }}>
                        <h4>Ideal World Arguments:</h4>
                        {getParamList('idealArgs')}
                    </div>
                </div>
            </Modal.Body>}
            <Modal.Footer className='arrowModalFooter'>
                <div className='diffBanner' style={{backgroundColor: messageContentMatches.content ? "green" : "red"}}>
                    {messageStatus}
                    {messageContentMatches.content ?
                        <FontAwesomeIcon className='diffCheck' icon={faCheck} size='2x'/> :
                        <FontAwesomeIcon className='diffXmark' icon={faXmark} size='2x'/>}
                </div>
                <Button variant="primary" onClick={handleArrowModalClose}> Close </Button>
            </Modal.Footer>
        </Modal>
    );
}

function Interpreter(props) {

    const auth = useAuth();
    const [show, setShow] = useState(false);
    const [file, setFile] = useState(null);
    const [showArrowModal, setShowArrowModal] = useState(false);

    const { setActive } = props;

    const defaultContainerHeight = 600;
    const messageOffset = 35;

    const fileTypes = ['txt'];
    const [parsedFile, setParsedFile] = useState(null);
    useEffect(() => setActive(true), [])

    const displayOptions = [{label: 'All', value: 'All'}, {label: 'Only Env', value:'Only Env'}, 
        {label: 'Only Adv', value: 'Only Adv'}, {label :'Env to World', value: 'Env to World'},
        {label: 'World to Env', value: 'World to Env'}, {label: 'World to Adv', value: 'World to Adv'},
        {label: 'Adv to World', value: 'Adv to World'}];

    const displayOptRef = React.createRef();

    const [displayOpt, setDisplayOpt] = useState(null);
    const [selMessageIdx, setSelMessageIdx] = useState(0);
    const [messageDiffInfo, setMessageDiffInfo] = useState(null);

    const [idealEvents, setIdealEvents] = useState(null);
    const [realEvents, setRealEvents] = useState(null);

    const [idealEnvMessages, setIdealEnvMessages] = useState(null);
    const [realEnvMessages, setRealEnvMessages] = useState(null);
    const [idealAdvMessages, setIdealAdvMessages] = useState(null);
    const [realAdvMessages, setRealAdvMessages] = useState(null);

    useEffect(() => {
        if(file && realEvents && idealEvents){
            setDisplayOpt(displayOptRef.current.getValue()[0].value)
            realEventsSetup()
            idealEventsSetup()
        }      
    }, [displayOptRef])

    useEffect(() => {
        if(file && realEvents && idealEvents){
            compareWorlds()
        }      
    }, [realEvents, idealEvents])

    const handleClose = () => {
        setShow(false);
    }

    const [ rawMessageData, setRawMessageData ] = useState({});
    const [ messageContentMatches, setMessageContentMatches ] = useState({});
    const [ messageStatus, setMessageStatus ] = useState("");

    const updateModalData = () => {
        if (messageDiffInfo === null) {
            return;
        }
        let messageData = messageDiffInfo.messages[selMessageIdx];
        let contentMatches = messageDiffInfo.contentMatches[selMessageIdx];
        let status = messageDiffInfo.messageStatus[selMessageIdx];
        setRawMessageData(messageData);
        setMessageContentMatches(contentMatches);
        setMessageStatus(status);
    }
    const handleShow = () => setShow(true);
    const handleArrowModalShow = (_, messageId) => {
        setSelMessageIdx(getMessageIdx(messageId));
        setShowArrowModal(true);
    }
    const selMessages = (arrowType) => {
        const filterCallback = (element, entity, outputCheck) => {
            if (element.type === "fail") {
                // Return true only if it's for an arrow to the environment
                return (entity === "Env" && outputCheck);
            } else if (element.type === "error") {
                return true;
            } else if (outputCheck) {
                return (element.toEntity === entity && element.outputTo === outputCheck);
            } else {
                return (element.fromEntity === entity);
            }
        }
        switch (arrowType) {
            case "realWorld2Env": {
                return {
                    type: "real",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Env', 'environment');
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Env', 'environment');
                    })
                };
            } case "env2RealWorld": {
                return {
                    type: "real",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Env', null);
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Env', null);
                    })
                };
            } case "realWorld2Adv": {
                return {
                    type: "real",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Adv', 'adversary');
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Adv', 'adversary');
                    })
                };
            } case "adv2RealWorld": {
                return {
                    type: "real",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Adv', null);
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Adv', null);
                    })
                };
            } case "idealWorld2Env": {
                return {
                    type: "ideal",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Env', 'environment');
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Env', 'environment');
                    })
                };
            } case "env2IdealWorld": {
                return {
                    type: "ideal",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Env', null);
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Env', null);
                    })
                };
            } case "idealWorld2Adv": {
                return {
                    type: "ideal",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Adv', 'adversary');
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Adv', 'adversary');
                    })
                };
            } case "adv2IdealWorld": {
                return {
                    type: "ideal",
                    real: realEvents.filter(element => {
                        return filterCallback(element, 'Adv', null);
                    }),
                    ideal: idealEvents.filter(element => {
                        return filterCallback(element, 'Adv', null);
                    })
                };
            } default: {
                return null;
            }
        }
    }
    
    const getMessageData = (arrowType) => {
        const allMessages = selMessages(arrowType);
        if (allMessages === null) {
            console.log(`allMessages is null for ${arrowType}`)
            return null;
        }
        let messages = [];
        if (allMessages.type === "real") {
            messages = allMessages.real.map((realMessage, arrowIdx) => {
                let idealMessage = null;
                let name = null;
                let mismatched = false;
                if (arrowIdx < allMessages.ideal.length) {
                    idealMessage = allMessages.ideal[arrowIdx];
                }
                if (realMessage.type === "fail") {
                    name = "<fail>";
                    mismatched = (idealMessage === null || idealMessage.type !== "fail");
                } else if (realMessage.type === "error") {
                    name = realMessage.errorMessage;
                    mismatched = true;
                } else if (realMessage.type === "message") {
                    name = realMessage.name;
                    mismatched = (idealMessage === null || realMessage.name !== idealMessage.name);
                };
                let ids = [realMessage.id];
                return {
                    name: name,
                    mismatched: mismatched,
                    direction: arrowType,
                    idx: arrowIdx,
                    ids: ids,
                    type: realMessage.type,
                    world: allMessages.type,
                    real: realMessage,
                    ideal: idealMessage,
                };
            });
        } else if (allMessages.type === "ideal") {
            messages = allMessages.ideal.map((idealMessage, arrowIdx) => {
                let realMessage = null;
                let name = null;
                let mismatched = false;
                if (arrowIdx < allMessages.real.length) {
                    realMessage = allMessages.real[arrowIdx];
                };
                if (idealMessage.type === "fail") {
                    name = "<fail>";
                    mismatched = (realMessage === null || realMessage.type !== "fail");
                } else if (idealMessage.type === "error") {
                    name = idealMessage.errorMessage;
                    mismatched = true;
                } else if (idealMessage.type === "message") {
                    name = idealMessage.name;
                    mismatched = (realMessage === null || realMessage.name !== idealMessage.name);
                };
                let ids = [idealMessage.id];
                return ({
                    name: name,
                    mismatched: mismatched,
                    direction: arrowType,
                    idx: arrowIdx,
                    ids: ids,
                    type: idealMessage.type,
                    world: allMessages.type,
                    real: realMessage,
                    ideal: idealMessage,
                });
            })
        };
        return messages;
    }

    const compareParams = (messageData) => {
        if (messageData === null) {
            return {
                same: false,
                real: [],
                ideal: [],
            };
        }
        let realParams = messageData.real !== null ? messageData.real.parameters : [];
        let idealParams = messageData.ideal !== null ? messageData.ideal.parameters : [];
        let isEqual = true;
        realParams.forEach((realParam, idx) => {
            isEqual = isEqual && ((idx < idealParams.length) && (realParam === idealParams[idx]));
        })
        idealParams.forEach((idealParam, idx) => {
            isEqual = isEqual && ((idx < realParams.length) && (idealParam === realParams[idx]));
        })
        let paramArgs = {
            same: isEqual,
            real: realParams,
            ideal: idealParams,
        };
        return paramArgs;
    }

    const compareWorlds = () => {
        let worldsDiff = {
            messages: [],
        };
        const messageTypes = {
            real: [
                "realWorld2Env",
                "env2RealWorld",
                "realWorld2Adv",
                "adv2RealWorld",
            ],
            ideal: [
                "idealWorld2Env",
                "env2IdealWorld",
                "idealWorld2Adv",
                "adv2IdealWorld",
            ],
        };
        messageTypes.real.forEach((arrowType) => {
            worldsDiff = {...worldsDiff, messages: [...worldsDiff.messages, ...getMessageData(arrowType)]}
        })
        messageTypes.ideal.forEach((arrowType) => {
            worldsDiff = {...worldsDiff, messages: [...worldsDiff.messages, ...getMessageData(arrowType)]}
        })
        let messagesRealNotIdeal = [];
        let messagesIdealNotReal = [];
        let errors = [];
        let fails = [];
        let toPorts = [];
        let fromPorts = [];
        let paramArgs = [];
        let matches = [];
        let statuses = [];
        worldsDiff.messages.forEach((message) => {
            if (message.world === "real") {
                messagesRealNotIdeal = [...messagesRealNotIdeal, (message.mismatched ? message : null)];
            } else {
                messagesIdealNotReal = [...messagesIdealNotReal, (message.mismatched ? message : null)];
            }
            errors = [...errors, (message.type === "error" ? message.errorMessage : null)];
            fails = [...fails, (message.type === "fail" ? "<Fail>" : null)];
            toPorts = [...toPorts, {
                real: (message.real !== null ? message.real.toPort : null),
                ideal: (message.ideal !== null ? message.ideal.toPort : null),
            }];
            fromPorts = [...fromPorts, {
                real: (message.real !== null ? message.real.fromPort : null),
                ideal: (message.ideal !== null ? message.ideal.fromPort : null),
            }];
            let paramsDiff = compareParams(message);
            paramArgs = [...paramArgs, paramsDiff];
            let portsMatch = (
                message.type === "message" && !message.mismatched && (
                    message.real.toPort === message.ideal.toPort
                ) && (
                    message.real.fromPort === message.ideal.fromPort
                )
            );
            let parametersMatch = paramsDiff.same;
            let contentMatches = (
                (message.type === "fail" && !message.mismatched) ||
                (message.type === "message" && portsMatch && parametersMatch)
            );
            matches = [...matches, {
                content: contentMatches,
                ports: portsMatch,
                params: parametersMatch,
            }];
            statuses = [...statuses, (
                (message.type === "fail" && message.mismatched) ? `Fails in ${message.world} world but NOT the other` : (
                    message.type === "error" ? "ERROR OCCURRED" : (
                        message.mismatched ? "MESSAGE NAME MISMATCH" : (
                            contentMatches ? "Messages Match" : (
                                !portsMatch ? "Message Ports do NOT match" : (
                                    !parametersMatch ? "Message Params do NOT match" : "UNKNOWN MISMATCH"
                                )
                            )
                        )
                    )
                )
            )];
        });
        worldsDiff = {
            ...worldsDiff,
            messagesRealNotIdeal: messagesRealNotIdeal,
            messagesIdealNotReal: messagesIdealNotReal,
            fails: fails,
            errors: errors,
            toPorts: toPorts,
            fromPorts: fromPorts,
            paramArgs: paramArgs,
            contentMatches: matches,
            messageStatus: statuses,
        };
        // console.log(worldsDiff.messages)
        setMessageDiffInfo(worldsDiff);
    }

    const getMessageIdx = (messageId) => {
        if (messageDiffInfo === null) {
            return null;
        }
        let messageIdx = null;
        messageDiffInfo.messages.forEach((message, idx) => {
            if (message.ids.includes(messageId)) {
                messageIdx = idx;
            }
        });
        return messageIdx;
    }

    const messageMatches = (messageId) => {
        if (messageDiffInfo === null) {
            return false;
        }
        let idx = getMessageIdx(messageId);
        if (idx === null) {
            return false;
        }
        return messageDiffInfo.contentMatches[idx].content;
    }

    const saveInfo = () => {
        let urlPath = process.env.REACT_APP_PARSER_PREFIX + "/" + file.name;
        let token = "none";
        if (process.env.NODE_ENV !== 'test') {
            token = auth.user?.access_token;
        }
        var bodyFormData = new FormData();
        bodyFormData.append(file.name, file);
        axios({
            method: "POST",
            url: urlPath,
            headers: {
            Authorization: `Bearer ${token}`,
            "Content-type": "multipart/form-data",
            },
            data: bodyFormData
        })
        .then((response) => {
            const res = response.data;
            setRealEvents(res.realWorld.events)
            setIdealEvents(res.idealWorld.events)            
            setParsedFile(res)
            setShow(false)
        })
        .catch((err) => {
            if (err.response) {
                console.log(err.response);
                console.log(err.response.status);
                console.log(err.response.headers);
            }
        })
    }
    const realEventsSetup = () => {
        var AdvMessages = [];
        var EnvMessages = [];
        var adjustedIdx = 0;
        var lastColumn = null;
        realEvents.forEach((element) => {
            let isMessage = element.type === "message";
            let isError = element.type === "error";
            if (isMessage && ((element.toEntity === "Env" && element.fromEntity === "Adv") || (element.toEntity === "Adv" && element.fromEntity === "Env"))) {
                if ((element.outputTo === "adversary" || element.outputTo === "environment") && displayOpt === 'All') {
                    EnvMessages.push({...element, adjIdx: adjustedIdx++})
                }
            } else if (isError && displayOpt === 'All') {
                EnvMessages.push({...element, adjIdx: adjustedIdx++})
            } else if ((!isMessage || (element.toEntity === "Env" && element.outputTo === "environment")) && (displayOpt === 'All' || displayOpt === 'Only Env' || displayOpt === 'World to Env' ) ){
                // Skip a line if the last message was to/from the adversary
                adjustedIdx = lastColumn === "Adv" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Env";
                EnvMessages.push({...element, adjIdx: adjustedIdx++});
            } else if ((isError || (isMessage && element.fromEntity === "Env")) && (displayOpt === 'All' || displayOpt === 'Only Env' || displayOpt === 'Env to World' )){
                adjustedIdx = lastColumn === "Adv" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Env";
                EnvMessages.push({...element, adjIdx: adjustedIdx++});
            } else if ((isError || (isMessage && element.toEntity === "Adv" && element.outputTo === "adversary")) && (displayOpt === 'All' || displayOpt === 'Only Adv' || displayOpt === 'World to Adv' )) {
                // Skip a line if the last message was to/from the environment
                adjustedIdx = lastColumn === "Env" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Adv";
                AdvMessages.push({...element, adjIdx: adjustedIdx++});
            } else if ((isError || (isMessage && element.fromEntity === "Adv")) && (displayOpt === 'All' || displayOpt === 'Only Adv' || displayOpt === 'Adv to World' )){
                adjustedIdx = lastColumn === "Env" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Adv";
                AdvMessages.push({...element, adjIdx: adjustedIdx++});
            }
        });
        setRealEnvMessages(EnvMessages)
        setRealAdvMessages(AdvMessages)
    
    }
    const idealEventsSetup = () => {
        var AdvMessages = [];
        var EnvMessages = [];
        var adjustedIdx = 0;
        var lastColumn = null;
        idealEvents.forEach(element => {
            let isMessage = element.type === "message";
            let isError = element.type === "error";
            if (isMessage && ((element.toEntity === "Env" && element.fromEntity === "Adv") || (element.toEntity === "Adv" && element.fromEntity === "Env"))) {
                if ((element.outputTo === "adversary" || element.outputTo === "environment") && displayOpt === 'All') {
                    EnvMessages.push({...element, adjIdx: adjustedIdx++})
                }
            } else if (isError && displayOpt === 'All') {
                EnvMessages.push({...element, adjIdx: adjustedIdx++})
            } else if ((!isMessage || (element.toEntity === "Env" && element.outputTo === "environment")) && (displayOpt === 'All' || displayOpt === 'Only Env' || displayOpt === 'World to Env' ) ){
                // Skip a line if the last event was to/from the adversary
                adjustedIdx = lastColumn === "Adv" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Env";
                EnvMessages.push({...element, adjIdx: adjustedIdx++});
            } else if ((isError || (isMessage && element.fromEntity === "Env")) && (displayOpt === 'All' || displayOpt === 'Only Env' || displayOpt === 'Env to World' )){
                adjustedIdx = lastColumn === "Adv" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Env";
                EnvMessages.push({...element, adjIdx: adjustedIdx++});
            } else if ((isError || (isMessage && element.toEntity === "Adv" && element.outputTo === "adversary")) && (displayOpt === 'All' || displayOpt === 'Only Adv' || displayOpt === 'World to Adv' )) {
                // Skip a line if the last event was to/from the environment
                adjustedIdx = lastColumn === "Env" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Adv";
                AdvMessages.push({...element, adjIdx: adjustedIdx++});
            } else if ((isError || (isMessage && element.fromEntity === "Adv")) && (displayOpt === 'All' || displayOpt === 'Only Adv' || displayOpt === 'Adv to World' )){
                adjustedIdx = lastColumn === "Env" ? adjustedIdx + 1 : adjustedIdx;
                lastColumn = "Adv";
                AdvMessages.push({...element, adjIdx: adjustedIdx++});
            }
        });
        setIdealEnvMessages(EnvMessages)
        setIdealAdvMessages(AdvMessages)
    }
    const saveParsedData = () => {
        const blob = new Blob([JSON.stringify(parsedFile)], {type: "text/plain"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        var filename = parsedFile.filename.split(".")[0]
        link.download = filename + ".json";
        link.href = url;
        link.click();
    }
    const handleFile = (newFile) => {
        setFile(newFile)
    }
    const navigateHome = () => {
        setActive(false)
        window.location.assign('/')
    }
    const anchorSpacing = (index) => {
        let currentHeight = calcContainerHeight();
        if (currentHeight <= defaultContainerHeight) {
            return -295 + index*messageOffset;
        }
        return Math.trunc(-295 + (defaultContainerHeight-currentHeight)/2 + index*messageOffset);
    };
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [hoveredArrowStyle, setHoveredArrowStyle] = useState(null);

    const handleMouseEnter = (index, message) => {
        let indEnt = index + message.id;
        let tooltipStyle = {};
        setHoveredIndex(indEnt);
        if (message.type !== "message" || message.toEntity === "Env" || message.fromEntity === "Env") {
            tooltipStyle = {right: "105%", left: "auto"}
        } else {
            tooltipStyle = {right: "auto", left: "105%"}
        }
        setHoveredArrowStyle(tooltipStyle)
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    const getArrowLabel = (message, color) => {
        let idx = getMessageIdx(message.id);
        return (
            <div className='arrowLabel' style={{ color: color }}>
                {
                    message.type === "error" ? message.stateNumber + " <error>" : (
                        message.type === "fail" ? message.stateNumber + " <fail>" : (
                            message.stateNumber + " " + message.name
                        )
                    )
                }
                <div className='tooltiptext' style={hoveredArrowStyle}>
                    {messageDiffInfo.messageStatus[idx]}
                </div>
            </div>
        );
    }

    const calcContainerHeight = () => {
        if (!(realEnvMessages && realAdvMessages && idealEnvMessages && idealAdvMessages)) {
            return defaultContainerHeight;
        }
        let lastMessages = [
            realEnvMessages[realEnvMessages.length-1],
            realAdvMessages[realAdvMessages.length-1],
            idealEnvMessages[idealEnvMessages.length-1],
            idealAdvMessages[idealAdvMessages.length-1]
        ];
        let maxIdx = 0;
        lastMessages.forEach((message) => {
            if (message && message.adjIdx > maxIdx) {
                maxIdx = message.adjIdx;
            }
        })
        let messageLength = messageOffset*(maxIdx + 1);
        if (messageLength < defaultContainerHeight) {
            return defaultContainerHeight;
        }
        return messageLength;
    }

    return (
        <div className='interpreterPage'>
            <h1>Interpreter World Viewer</h1>

            <div className='displayAndFileOptions'>
                {file &&
                    <Select
                        options={displayOptions}
                        getOptionValue={(option) => option.label}
                        placeholder="Select what messages you want to see"
                        defaultValue={{ label: 'All', value: 'All' }}
                        ref={displayOptRef}
                        className="displayMessages"
                        maxMenuHeight={125}
                    />
                }
                {file &&
                    <FontAwesomeIcon className="exportDataBtn" data-testid="exportIcon"
                        onClick={() => saveParsedData()} title={"Save Parser Output"}
                        icon={faFileArrowDown} size="2x" />
                }
                <FontAwesomeIcon className='addFileBtn' title={"Add Interpreter Output File"}
                    icon={faPlusCircle} size="2x" onClick={() => handleShow()} />

            </div>
            <div className='navToHomeApp'>
                <img src="/images/favicon.ico" alt="logo" width="30" className='navToHomeBtn' onClick={() => navigateHome()} />
            </div>
            <div className='world-Containers'>
                <div className='realWorldDiff' style={{ height: calcContainerHeight() + 200 }}>
                    <h2> Real World </h2>
                    <Row className='realWorldDisplay'>
                        <Col className='realEnv' id='realEnv' style={{ height: calcContainerHeight() }}>
                            Environment
                        </Col>
                        <Col className='realEnvMessages'>

                        </Col>
                        <Col className='realWorld' id='realWorld' style={{ height: calcContainerHeight() }}>
                            Real World
                        </Col>
                        <Col className='realAdvMessages'>

                        </Col>
                        <Col className='realAdv' id='realAdv' style={{ height: calcContainerHeight() }}>
                            Adversary
                        </Col>
                    </Row>
                </div>
                <div className='space' />
                <div className='idealWorldDiff' style={{ height: calcContainerHeight() + 200 }}>
                    <h2> Ideal World </h2>
                    <Row className='idealWorldDisplay'>
                        <Col className='idealEnv' id='idealEnv' style={{ height: calcContainerHeight() }}>
                            Environment
                        </Col>
                        <Col className='idealEnvMessages'>

                        </Col>
                        <Col className='idealWorld' id='idealWorld' style={{ height: calcContainerHeight() }}>
                            Ideal World
                        </Col>
                        <Col className='idealAdvMessages'>

                        </Col>
                        <Col className='idealAdv' id='idealAdv' style={{ height: calcContainerHeight() }}>
                            Adversary
                        </Col>
                    </Row>
                </div>
            </div>
            <Modal show={show} onHide={handleClose} animation={false} data-testid="interpreter-modal">
                <Modal.Header>
                    <Modal.Title> Add an Interpreter Output File</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FileUploader onDrop={handleFile} handleChange={handleFile} name="file" types={fileTypes} label="Add UCDSL Interpreter Output File" multiple={false}></FileUploader>
                    <br></br>
                    {file ? <h3> {file.name} is currently loaded</h3> : <h3> No file is loaded </h3>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={saveInfo}> Save Changes </Button>
                    <Button variant="secondary" onClick={handleClose}> Close </Button>
                </Modal.Footer>
            </Modal>
            <ArrowModal diffInfo={messageDiffInfo} selIdx={selMessageIdx}
                showModal={showArrowModal} setShowModal={setShowArrowModal}
                setupModal={updateModalData} rawMessageData={rawMessageData}
                messageContentMatches={messageContentMatches}
                messageStatus={messageStatus}
            />
            { /* Arrows */}
            {file && realEnvMessages && messageDiffInfo &&
                (realEnvMessages.map((message, idx) => (
                    (message.type !== "message" || (message.toEntity === "Env" && message.outputTo === "environment") || (message.toEntity === "Adv" && message.outputTo === "adversary")) ? (
                        (message.type === "fail" || (message.fromEntity === "World" && message.toEntity === "Env" && message.outputTo === "environment")) ? (
                            <div key={message.id + `-${message.type}-${idx}`}
                                onMouseEnter={() => handleMouseEnter(idx, message)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleArrowModalShow('realWorld2Env', message.id)}
                                className='messageArrows'
                            >
                                <Xarrow key={message.id + `-${message.type}-${idx}-connector`}
                                    start='realWorld' end="realEnv" zIndex={100}
                                    showHead={message.type !== "error"} path="grid"
                                    color={message.type === "error" ? "black" : "blue"}
                                    data-testid="realToEnvDirectArrow"
                                    dashness={!messageMatches(message.id)}
                                    startAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    endAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>} />
                            </div>) : (
                            (message.type === "error" || (message.toEntity === "Adv" && message.outputTo === "adversary")) ? (
                                <div key={message.id + idx}
                                    onMouseEnter={() => handleMouseEnter(idx, message)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleArrowModalShow('env2Adv', message.id)}
                                    className='messageArrows'
                                >
                                    <Xarrow key={message.id + "-connector"} start='realEnv' end={displayOpt === "All" ? "realAdv" : "realWorld"} zIndex={100}
                                        showHead={message.type !== "error"} path="grid"
                                        color={message.type === "error" ? "black" : "green"}
                                        data-testid="realEnvToAdvDirectArrow"
                                        dashness={!messageMatches(message.id)}
                                        startAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                        endAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                        labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                    />
                                </div>) : (
                                (message.fromEntity === "Adv" && (message.toEntity === "Env" && message.outputTo === "environment")) ? (
                                    <div key={message.id + idx}
                                        onMouseEnter={() => handleMouseEnter(idx, message)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => handleArrowModalShow('adv2Env', message.id)}
                                        className='messageArrows'
                                    >
                                        <Xarrow key={message.id + "-connector"} start='realAdv' end="realEnv" zIndex={100}
                                            showHead={message.type !== "error"} path="grid"
                                            color={message.type === "error" ? "black" : "green"}
                                            data-testid="realAdvToEnvDirectArrow"
                                            dashness={!messageMatches(message.id)}
                                            startAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                            endAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                            labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                        />
                                    </div>) : <div> </div>
                            ))) : (
                        (message.type === "message" && (message.fromEntity === "Env" && message.toEntity === "World")) ? (
                            <div key={message.id + `-${message.type}-${idx}`}
                                onMouseEnter={() => handleMouseEnter(idx, message)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleArrowModalShow('env2RealWorld', message.id)}
                                className='messageArrows'
                            >
                                <Xarrow key={message.id + `-${message.type}-${idx}-connector`}
                                    start='realEnv' end="realWorld" zIndex={100}
                                    showHead={message.type !== "error"} path="grid"
                                    color={message.type === "error" ? "black" : "maroon"}
                                    data-testid="envToRealDirectArrow"
                                    dashness={!messageMatches(message.id)}
                                    startAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    endAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "maroon") : <div> </div>}
                                /> </div>
                        ) : <div> </div>))))}
            {file && realAdvMessages &&
                (realAdvMessages.map((message, idx) => (
                    (message.toEntity === "Adv") ?
                        ((message.outputTo === "adversary") ?
                            <div key={message.id + idx}
                                onMouseEnter={() => handleMouseEnter(idx, message)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleArrowModalShow('realWorld2Adv', message.id)}
                                className='messageArrows'
                            >
                                <Xarrow key={message.id + "-connector"} start='realWorld' end="realAdv" zIndex={100}
                                    showHead={message.type !== "error"} path="grid"
                                    color={message.type === "error" ? "black" : "blue"}
                                    data-testid="realToAdvDirectArrow"
                                    dashness={!messageMatches(message.id)}
                                    startAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    endAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                /> </div> : <></>) :
                        <div key={message.id + idx}
                            onMouseEnter={() => handleMouseEnter(idx, message)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleArrowModalShow('adv2RealWorld', message.id)}
                            className='messageArrows'
                        >
                            <Xarrow key={message.id + "-connector"} start='realAdv' end="realWorld" zIndex={100}
                                showHead={message.type !== "error"} path="grid"
                                color={message.type === "error" ? "black" : "maroon"}
                                data-testid="advToRealDirectArrow"
                                dashness={!messageMatches(message.id)}
                                startAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                endAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "maroon") : <div> </div>}
                            />  </div>
                )))}
            {file && idealEnvMessages &&
                (idealEnvMessages.map((message, idx) => (
                    (message.type !== "message" || (message.toEntity === "Env" && message.outputTo === "environment") || (message.toEntity === "Adv" && message.outputTo === "adversary")) ? (
                        (message.type === "fail" || (message.fromEntity === "World" && message.toEntity === "Env" && message.outputTo === "environment")) ? (
                            <div key={message.id + idx}
                                onMouseEnter={() => handleMouseEnter(idx, message)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleArrowModalShow('idealWorld2Env', message.id)}
                                className='messageArrows'
                            >
                                <Xarrow key={message.id + "-connector"} start='idealWorld' end="idealEnv" zIndex={100}
                                    showHead={message.type !== "error"} path="grid"
                                    color={message.type === "error" ? "black" : "blue"}
                                    data-testid="idealToEnvDirectArrow"
                                    dashness={!messageMatches(message.id)}
                                    startAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    endAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                />
                            </div>) : (
                            (message.type === "error" || (message.toEntity === "Adv" && message.outputTo === "adversary")) ? (
                                <div key={message.id + idx}
                                    onMouseEnter={() => handleMouseEnter(idx, message)}
                                    onMouseLeave={handleMouseLeave}
                                    onClick={() => handleArrowModalShow('env2Adv', message.id)}
                                    className='messageArrows'
                                >
                                    <Xarrow key={message.id + "-connector"} start='idealEnv' end={displayOpt === "All" ? "idealAdv" : "idealWorld"} zIndex={100}
                                        showHead={message.type !== "error"} path="grid"
                                        color={message.type === "error" ? "black" : "green"}
                                        data-testid="idealEnvToAdvDirectArrow"
                                        dashness={!messageMatches(message.id)}
                                        startAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                        endAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                        labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                    /> </div>) : (
                                (message.fromEntity === "Adv" && message.toEntity === "Env" && message.outputTo === "environment") ? (
                                    <div key={message.id + idx}
                                        onMouseEnter={() => handleMouseEnter(idx, message)}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => handleArrowModalShow('adv2Env', message.id)}
                                        className='messageArrows'
                                    >
                                        <Xarrow key={message.id + "-connector"} start='idealAdv' end="idealEnv" zIndex={100}
                                            showHead={message.type !== "error"} path="grid"
                                            color={message.type === "error" ? "black" : "green"}
                                            data-testid="idealAdvToEnvDirectArrow"
                                            dashness={!messageMatches(message.id)}
                                            startAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                            endAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                            labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                        /> </div>) : <div> </div>
                            ))) : (
                        (message.type === "message" && (message.fromEntity === "Env" && message.toEntity === "World")) ? (
                            <div key={message.id + `-${message.type}-${idx}`}
                                onMouseEnter={() => handleMouseEnter(idx, message)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleArrowModalShow('env2IdealWorld', message.id)}
                                className='messageArrows'
                            >
                                <Xarrow key={message.id + `-${message.type}-${idx}-connector`}
                                    start='idealEnv' end="idealWorld" zIndex={100}
                                    showHead={message.type !== "error"} path="grid"
                                    color={message.type === "error" ? "black" : "maroon"}
                                    data-testid="envToIdealDirectArrow"
                                    dashness={!messageMatches(message.id)}
                                    startAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    endAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "maroon") : <div> </div>}
                                /> </div>
                        ) : <div> </div>))))}
            {file && idealAdvMessages &&
                (idealAdvMessages.map((message, idx) => (
                    (message.toEntity === "Adv") ?
                        ((message.outputTo === "adversary") ?
                            <div key={message.id + idx}
                                onMouseEnter={() => handleMouseEnter(idx, message)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleArrowModalShow('idealWorld2Adv', message.id)}
                                className='messageArrows'
                            >
                                <Xarrow key={message.id + "-connector"} start='idealWorld' end="idealAdv" zIndex={100}
                                    showHead={message.type !== "error"} path="grid"
                                    color={message.type === "error" ? "black" : "blue"}
                                    data-testid="idealToAdvDirectArrow"
                                    dashness={!messageMatches(message.id)}
                                    startAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    endAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                    labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "blue") : <div> </div>}
                                /> </div> : <></>) :
                        <div key={message.id + idx}
                            onMouseEnter={() => handleMouseEnter(idx, message)}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => handleArrowModalShow('adv2IdealWorld', message.id)}
                            className='messageArrows'
                        >
                            <Xarrow key={message.id + "-connector"} start='idealAdv' end="idealWorld" zIndex={100}
                                showHead={message.type !== "error"} path="grid"
                                color={message.type === "error" ? "black" : "maroon"}
                                data-testid="advToIdealDirectArrow"
                                dashness={!messageMatches(message.id)}
                                startAnchor={{ position: "left", offset: { y: anchorSpacing(message.adjIdx) } }}
                                endAnchor={{ position: "right", offset: { y: anchorSpacing(message.adjIdx) } }}
                                labels={hoveredIndex === idx + message.id ? getArrowLabel(message, "maroon") : <div> </div>}
                            />  </div>
                )))}
        </div>

    );
}

export default Interpreter;
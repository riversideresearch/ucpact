/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import "./modelList.css"
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "react-oidc-context";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSort, faFilter } from '@fortawesome/free-solid-svg-icons';


function ModelList(props) {

    const [apiData, setApiData] = useState();
    const auth = useAuth();

    const [tableData, setTableData] = useState();
    const [nameSortState, setNameSortState] = useState(true);
    const [lastModifiedState, setLastModifiedState] = useState(true);
    const [statusFilterState, setStatusFilterState] = useState('');
    const [, setSearchWidth] = useState('600');

    const tableSearchRef = useRef({});
    const tableRef = useRef({});

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

    useEffect(() => {
        if (apiData) {
            setTableData(apiData);
        }
    }, [apiData]);

    const hideTabId = (model) => {
        if (!model['readOnly']) {
            return "";
        }
        let username = model['readOnly'].split('/')[0];
        return username;
    }

    const nameSort = () => {
        if (nameSortState) {
            tableData.sort((a, b) => a.name.localeCompare(b.name));
            setNameSortState(!nameSortState);
            setLastModifiedState(true);
        } else {
            tableData.sort((a, b) => b.name.localeCompare(a.name));
            setNameSortState(!nameSortState);
            setLastModifiedState(true);
        } 
    }
    
    const lastModifiedSort = () => {
        if (lastModifiedState) {
            tableData.sort((a, b) => b.lastModified - a.lastModified);
            setLastModifiedState(!lastModifiedState);
            setNameSortState(true);
        } else {
            tableData.sort((a, b) => a.lastModified - b.lastModified);
            setLastModifiedState(!lastModifiedState);
            setNameSortState(true);
        }
    }

    const statusFilter = () => {
        if (statusFilterState === '') {
            let newData = apiData.filter(model => model.readOnly === '');
            setTableData(newData);
            setStatusFilterState('Writable');
        } else if (statusFilterState === 'Writable') {
            let newData = apiData.filter(model => model.readOnly !== '');
            newData = newData.filter(model => model.readOnly !== 'CORRUPTED');
            setTableData(newData)
            setStatusFilterState('ReadOnly');
        } else if (statusFilterState === 'ReadOnly') {
            let newData = apiData.filter(model => model.readOnly === 'CORRUPTED');
            setTableData(newData)
            setStatusFilterState('Corrupted')
        } else {
            setTableData(apiData);
            setStatusFilterState('');
        }
    }

    const tableSearch = () => {
        if (tableSearchRef.current && document.getElementById("modelTable")) {
            let searchValue = tableSearchRef.current.value.toUpperCase();
            let table = document.getElementById("modelTable");
            let rows = table.getElementsByTagName("tr");

            for (let i = 1; i < rows.length; i++) {
                let td = rows[i].getElementsByTagName("td")[0];
                if (td) {
                    let txtValue = td.textContent || td.innerText;
                    if (txtValue.toUpperCase().indexOf(searchValue) > -1) {
                        rows[i].style.display = "";
                    } else {
                        rows[i].style.display = "none";
                    }
                }
            }
        }
    }

    const modelLink = (model) => {
        if (!model['readOnly']) {
            return <Link to={"/model/" + model['name']}>Edit</Link>;
        } else if (model['readOnly'] === 'CORRUPTED') {
            return <span className='corruptedText'>CORRUPTED</span>;
        } else {
            return <Link to={"/model/" + model['name']}>View</Link>;
        }
    }

    const modelStatusDisplay = (model) => {
        if (!model['readOnly']) {
            return <span className='writableText'>Writable</span>;
        } else if (model['readOnly'] === 'CORRUPTED') {
            return <span className='corruptedText'>CORRUPTED</span>;
        } else {
            return <span className='readOnlyText'> {`Read Only: ${hideTabId(model)}`}</span>;
        }
    }

    return (
        <div className='list-container'>
            <input type="text" id="tableSearch" onChange={tableSearch} placeholder="Search for models..." ref={tableSearchRef} />
            {tableData && (
            <table className="tableStyle" id="modelTable" ref={tableRef} onChange={(width) => setSearchWidth(width)}>
                <thead>
                    <tr>
                        <td onClick={nameSort} className="nameHeader">Name  <FontAwesomeIcon icon={faSort} /></td>
                        <td onClick={statusFilter} className="statusHeader">Status  <FontAwesomeIcon icon={faFilter} /></td>
                        <td onClick={lastModifiedSort} className="lastModifiedHeader">Last Modified  <FontAwesomeIcon icon={faSort} /></td>
                        <td>Actions</td>
                        <td>Delete</td>
                    </tr>
                </thead>
                <tbody>
                {tableData.map((model, idx) => (
                    <tr key={model.name}>
                        <td>{model.name}</td>
                        <td>{modelStatusDisplay(model)}</td>
                        <td>{new Date(model.lastModified * 1000).toLocaleString()}</td>
                        <td>{modelLink(model)}</td>
                        <td className="modelDelete"><FontAwesomeIcon icon={faTrash} title="Delete Model" className="trashcan" onClick={() => deleteModel(model['name'])} /></td>
                    </tr>
                ))}
                </tbody>
            </table>
            )}
        </div>
    );
}

export default ModelList;

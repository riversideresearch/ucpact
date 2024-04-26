/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import "./modelList.css"
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "react-oidc-context";

function ModelList(props) {

    const [apiData, setApiData] = useState();
    const auth = useAuth();

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

    return (
        <div className='list-container'>
            <h1>Models</h1>
            {apiData && (
            <table>
                <thead>
                    <tr>
                        <td>ID</td>
                        <td>Name</td>
                        <td>ReadOnly</td>
                        <td>Edit</td>
                    </tr>
                </thead>
                <tbody>
                {apiData.map((model, idx) => (
                    <tr key={model.name}>
                        <td>{idx}</td>
                        <td>{model.name}</td>
                        <td>{!model.readOnly ? "False" : "True"}</td>
                        <td><Link to={"/model/" + model.name}>Edit</Link></td>
                    </tr>
                ))}
                </tbody>
            </table>
            )}
        </div>
    );
}

export default ModelList;

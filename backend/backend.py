#!/usr/bin/env python

import os
import fcntl
import logging
from contextlib import contextmanager
import json
import re
from flask import Flask, jsonify, request
from flask_api import status
from flask_cors import CORS
import jwt
from jwt.exceptions import ExpiredSignatureError
import requests
import time

app = Flask(__name__)
CORS(app)

def validation_check(id):
    regexcheck = re.compile("^(?!UC_)(?!.*__)(?!.*[^A-Za-z_0-9])(?!.*_$)[A-Z][A-Za-z_0-9]*")
    returnValue = regexcheck.fullmatch(id)
    if returnValue is None:
        return False
    else:
        return True

@contextmanager
def locked_open(filename, mode, lock_type):
    """locked_open(filename, mode='r') -> <open file object>
    
       Context manager that on entry opens the path `filename`, using `mode`
       (default: `r`), and applies an advisory write lock on the file which
       is released when leaving the context. Yields the open file object for
       use within the context.
    """
    with open(filename, mode) as fd:
        try:
            fcntl.flock(fd, lock_type)
            logging.debug(f'acquired lock on {filename}')
            yield fd
        finally:
            logging.debug(f'releasing lock on {filename}')
            fcntl.flock(fd, fcntl.LOCK_UN)

def lock_model(fileName, username):
    try:
        with locked_open(fileName, 'r', fcntl.LOCK_EX) as fp:
            data = json.load(fp)
    except json.JSONDecodeError:
        logging.debug(f'File {fileName} is corrupted!')
        raise

    data['readOnly'] = username

    with locked_open(fileName, 'w', fcntl.LOCK_EX) as fp:
        json.dump(data, fp, indent=2)

def unlock_model(fileName):
    try:
        with locked_open(fileName, 'r', fcntl.LOCK_EX) as fp:
            data = json.load(fp)
    except json.JSONDecodeError:
        logging.debug(f'File {fileName} is corrupted!')
        raise

    data['readOnly'] = ""

    with locked_open(fileName, 'w', fcntl.LOCK_EX) as fp:
        json.dump(data, fp, indent=2)
class PubKey:
    val: str = ""

class AuthenticationError(BaseException):
    pass

def retrieve_public_key():
    key_location_uri = os.environ["KC_PUBLIC_KEY_URI"]
    r = requests.get(key_location_uri)
    if r.status_code == 200:
        pbkey_raw = r.json()["public_key"]
        pbkey = f"-----BEGIN PUBLIC KEY-----\n{pbkey_raw}\n-----END PUBLIC KEY-----"
        return pbkey
    else:
        return ""

def decode_token(auth_token) -> dict:
    if not PubKey.val:
        PubKey.val = retrieve_public_key()
    if PubKey.val:
        public_key = PubKey.val
    else:
        token_data = {"info": {},
                      "username": "",
                      "token_status": "public_key_missing"}
        return token_data
    if auth_token is not None and auth_token.startswith('Bearer '):
        auth_token = ' '.join(auth_token.split(' ')[1:])
    elif auth_token is None:
        token_data = {"info": {},
                      "username": "",
                      "token_status": "token_missing"}
        return token_data
    try:
        token_info = jwt.decode(auth_token, key=public_key, algorithms=["RS256"])
        username = token_info['preferred_username']
        token_status = "valid"
    except ExpiredSignatureError:
        token_info = {}
        username = ""
        token_status = "expired"
    except Exception:
        token_info = {}
        username = ""
        token_status = "invalid"
    token_data = {"info": token_info,
                  "username": username,
                  "token_status": token_status}
    return token_data

def validate_token(auth_token) -> str:
    data = decode_token(auth_token)
    if data["token_status"] == "valid":
        return data["username"]
    else:
        raise AuthenticationError(f'Error: token status = {data["token_status"]}!')

@app.route('/model', methods=['GET'])
def index():
    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    res = []
    for file in os.listdir('./models'):
        if file.endswith('.json'):
            fileName = os.path.join('models', file)
            try:
                with locked_open(fileName, 'r', fcntl.LOCK_SH) as fp:
                    full_data = json.load(fp)
            except json.JSONDecodeError:
                res.append({'name': file.removesuffix('.json'), 'readOnly': 'CORRUPTED'})
                continue
            data = full_data['model']
            data['modelVersion'] = full_data.get('modelVersion') if 'modelVersion' in full_data else ""
            if ((full_data['lastModified'] < (time.time() - 4500)) and (full_data['readOnly'] != "")):
                full_data['readOnly'] = ""
                full_data['lastModified'] = time.time()
                with locked_open(fileName, 'w', fcntl.LOCK_EX) as fp:
                    json.dump(full_data, fp, indent=2)
                res.append({'name' : data['name'], 'readOnly' : "", 'lastModified': full_data['lastModified']})
            else:
                res.append({'name' : data['name'], 'readOnly' : full_data['readOnly'], 'lastModified': full_data['lastModified']})
    return jsonify(res)


@app.route('/model/<id>', methods=['GET'])
def get_model(id):
    token = request.headers.get('Authorization')
    tabId = request.headers.get('SessionTabId')
    try:
        username = validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    fileName = os.path.join('models', id) + '.json'

    if not os.path.exists(fileName):
        return 'No file of that name exists', status.HTTP_404_NOT_FOUND
    try:
        with locked_open(fileName, 'r', fcntl.LOCK_EX) as fp:
            full_data = json.load(fp)
    except json.JSONDecodeError:
        return "Can't open model; JSON file is corrupted!", status.HTTP_500_INTERNAL_SERVER_ERROR
    data = full_data['model']
    data['modelVersion'] = full_data.get('modelVersion') if 'modelVersion' in full_data else ""
    if full_data['readOnly'] == f'{username}/{tabId}':
        data['readOnly'] = ""
    elif full_data['readOnly']:
        data['readOnly'] = full_data['readOnly']
    else:
        try:
            lock_model(fileName, f'{username}/{tabId}')
        except json.JSONDecodeError:
            return "Can't open model; JSON file is corrupted!", status.HTTP_500_INTERNAL_SERVER_ERROR
    return data, status.HTTP_200_OK

@app.route('/model/<id>', methods=['POST'])
def post_model(id):
    token = request.headers.get('Authorization')
    tabId = request.headers.get('SessionTabId')
    model_ver = os.environ["MODEL_VERSION"]
    try:
        username = validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    if not validation_check(id):
        return 'Model could not be created due to an invalid name', status.HTTP_400_BAD_REQUEST
    content_type = request.headers.get('Content-Type')
    if content_type == 'application/json':
        filename = os.path.join('models', id) + '.json'
        
        # if file exists, return 412 error status code
        if os.path.exists(filename):
            return 'Model of that name already exists', status.HTTP_412_PRECONDITION_FAILED
            

        # save the body of the POST as the JSON data in the file
        # use id + '.json' as the name of the file, put it in the models
        # directory
        with locked_open(filename, 'w', fcntl.LOCK_EX) as fp:
            file_data = {}
            data = request.json
            data['modelVersion'] = model_ver
            file_data['model'] = data
            file_data['modelVersion'] = model_ver
            file_data['readOnly'] = f'{username}/{tabId}'
            file_data['lastModified'] = time.time()
            json.dump(file_data, fp, indent=2)
        return data, status.HTTP_201_CREATED
    else:
        return 'Content-Type not supported!', status.HTTP_415_UNSUPPORTED_MEDIA_TYPE

@app.route('/model/<id>', methods=['PUT'])
def put_model(id):
    token = request.headers.get('Authorization')
    tabId = request.headers.get('SessionTabId')
    try:
        username = validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    if not validation_check(id):
        return 'Model could not be created due to an invalid name', status.HTTP_400_BAD_REQUEST
    content_type = request.headers.get('Content-Type')
    if content_type == 'application/json':
        filename = os.path.join('models', id) + '.json'
        
        # if file exists, retrieve modelVersion from the JSON
        if os.path.exists(filename):
            try:
                with locked_open(filename, 'r', fcntl.LOCK_EX) as fp:
                    old_data = json.load(fp)
            except json.JSONDecodeError:
                return "Can't open model; JSON file is corrupted!", status.HTTP_500_INTERNAL_SERVER_ERROR
        else:
            return 'No model of the supplied identifier exists on the server', status.HTTP_404_NOT_FOUND
            
        data = request.json
        # save the body of the POST as the JSON data in the file
        # use id + '.json' as the name of the file, put it in the models
        # directory
        newName = data['name']
        if id != newName and newName != "":
            # if file exists, and its name is changed remove it
            oldFileName = filename            
            filename = os.path.join('models', newName) + '.json'
            if os.path.exists(filename):
                return 'Model of that name already exists', status.HTTP_412_PRECONDITION_FAILED
            os.remove(oldFileName)

        with locked_open(filename, 'w', fcntl.LOCK_EX) as fp:
            file_data = {}
            data['modelVersion'] = old_data.get('modelVersion') if 'modelVersion' in old_data else ""
            file_data['model'] = data
            file_data['readOnly'] = f'{username}/{tabId}'
            file_data['lastModified'] = time.time()
            file_data['modelVersion'] = data['modelVersion']
            json.dump(file_data, fp, indent=2)
        return data, status.HTTP_201_CREATED
    else:
        return 'Content-Type not supported!', status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    
@app.route('/model/<id>', methods=['DELETE'])
def delete_model(id):

    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    if not validation_check(id):
        return 'Unallowed Model Name', status.HTTP_400_BAD_REQUEST

    filename = os.path.join('models', id) + '.json'

    # if file exists, remove it
    if os.path.exists(filename):
        os.remove(filename)

        return 'Model Deleted', status.HTTP_200_OK
    else:
        return 'Model not found', status.HTTP_400_BAD_REQUEST
    
@app.route('/model/return', methods=['GET'])
def return_all_by_user():
    token = request.headers.get('Authorization')
    [sessionId, _] = request.headers.get('SessionTabId').split('/')
    try:
        username = validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    res = []
    for file in os.listdir('./models'):
        if file.endswith('.json'):
            fileName = os.path.join('models', file)
            try:
                with locked_open(fileName, 'r', fcntl.LOCK_SH) as fp:
                    full_data = json.load(fp)
            except json.JSONDecodeError:
                # model's JSON file is corrupted
                continue
            # if request contained writable model, unlock it
            if not full_data['readOnly'] or full_data['readOnly'].startswith(f'{username}/{sessionId}/'):
                try:
                    unlock_model(fileName)
                except json.JSONDecodeError:
                    # model's JSON file is corrupted
                    continue
                res.append(fileName)
    return f"{len(res)} model(s) returned!", status.HTTP_200_OK

@app.route('/model/return/<id>', methods=['PUT'])
def return_model(id):
    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    content_type = request.headers.get('Content-Type')
    if content_type == 'application/json':
        filename = os.path.join('models', id) + '.json'
        
        # if file exists
        if os.path.exists(filename):
            data = request.json
            # if request contained writable model, unlock it
            if not data['readOnly']:
                try:
                    unlock_model(filename)
                except json.JSONDecodeError:
                    return "Can't return model; JSON file is corrupted!", status.HTTP_500_INTERNAL_SERVER_ERROR
                return 'Model Returned', status.HTTP_200_OK
            else:
                return 'Not authorized to unlock this model', status.HTTP_403_FORBIDDEN
        else:
            return 'No model of the supplied identifier exists on the server', status.HTTP_404_NOT_FOUND


@app.route('/model/idealFunctionalities', methods=['GET'])
def get_IFs():

    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    ifs = []
    files = [os.path.join('models', file) for file in os.listdir('./models') if file.endswith('.json')]
    for file in files:
        try:
            with locked_open(file, 'r', fcntl.LOCK_SH) as fp:
                full_data = json.load(fp)
        except json.JSONDecodeError:
            # Model JSON file is corrupted!
            # data = {'id': 'UNKNOWN', 'model_name': file.removesuffix('.json'),
            #         'idealFunctionality_id': 'UNKONWN', 'idealFunctionality_name': 'UNKNOWN'}
            continue
        data = full_data['model']

        ifs.append({'model_id': data['id'], 'model_name': data['name'],
            'idealFunctionality_id': data['idealFunctionality']['id'], 
            'idealFunctionality_name': data['idealFunctionality']['name']})

    return jsonify(ifs)

@app.route('/model/idealFunctionalities/<id>/messages', methods=['GET'])
def get_messages_of_IF(id):

    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    messages = []
    basicIntersIds = []       
    messagesIds = []
    final_compInter = {}
    files = [os.path.join('models', file) for file in os.listdir('./models') if file.endswith('.json')]
    for file in files:
        try:
            with locked_open(file, 'r', fcntl.LOCK_SH) as fp:
                full_data = json.load(fp)
        except json.JSONDecodeError:
            # Model JSON file is corrupted!
            continue
        data = full_data['model'] 

        if (data['idealFunctionality']['id'] == id):
            for compInter in data['interfaces']['compInters']:
                if (data['idealFunctionality']['compositeDirectInterface'] == compInter['id']):
                    final_compInter = compInter
                    for basicInter in compInter['basicInterfaces']:
                        basicIntersIds.append(basicInter['idOfBasic'])

            for basicInter in data['interfaces']['basicInters']:
                if (data['idealFunctionality']['basicAdversarialInterface'] == basicInter['id']):
                    basicIntersIds.append(basicInter['id'])

            for basicInter in data['interfaces']['basicInters']:
                if (basicInter['id'] in basicIntersIds):
                    messagesIds.extend(basicInter['messages'])

            for message in data['interfaces']['messages']:
                if message['id'] in messagesIds:
                    message['compInter'] = final_compInter # Pass information about comp interface for code generation
                    for basicInter in data['interfaces']['basicInters']:
                        if message['id'] in basicInter['messages']:
                            message['basicInter'] = basicInter # Pass information about basic instance for code generation
                    messages.append(message)
    
    return jsonify(messages)


@app.route('/model/compInterfaces', methods=['GET'])
def get_comps():

    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    comps = []
    files = [os.path.join('models', file) for file in os.listdir('./models') if file.endswith('.json')]
    for file in files:
        try:
            with locked_open(file, 'r', fcntl.LOCK_SH) as fp:
                full_data = json.load(fp)
        except json.JSONDecodeError:
            # Model JSON file is corrupted!
            continue
        data = full_data['model']

        for compInt in data['interfaces']['compInters']:
            if compInt['type'] == 'direct':

                comps.append({'model_id': data['id'], 'model_name': data['name'],
                'compInterface_id': compInt['id'],'compInterface_name': compInt['name']})

    return jsonify(comps)
    
@app.route('/model/compInterfaces/<id>/messages', methods=['GET'])
def get_comp_messages(id):

    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    messages = []
    basicIntersIds = []
    messagesIds = []
    final_compInter = {}
    files = [os.path.join('models', file) for file in os.listdir('./models') if file.endswith('.json')]
    for file in files:
        try:
            with locked_open(file, 'r', fcntl.LOCK_SH) as fp:
                full_data = json.load(fp)
        except json.JSONDecodeError:
            # Model JSON file is corrupted!
            continue
        data = full_data['model']

        for compInter in data['interfaces']['compInters']:
            if (compInter['id'] == id):
                final_compInter = compInter
                for basicInter in compInter['basicInterfaces']:
                    basicIntersIds.append(basicInter['idOfBasic'])

        for basicInter in data['interfaces']['basicInters']:
            if (basicInter['id'] in basicIntersIds):
                messagesIds.extend(basicInter['messages'])

        for message in data['interfaces']['messages']:
                if message['id'] in messagesIds:
                    message['compInter'] = final_compInter # Pass information about comp interface for code generation
                    for basicInter in data['interfaces']['basicInters']:
                        if message['id'] in basicInter['messages']:
                            message['basicInter'] = basicInter # Pass information about basic instance for code generation
                    messages.append(message)
    
    return jsonify(messages)

#!/usr/bin/env python

import os
import fcntl
import logging
from contextlib import contextmanager
import json
import re
from flask import Flask, jsonify, request, send_file
from starlette import status
from flask_cors import CORS
import jwt
from jwt.exceptions import InvalidTokenError
import requests
from interpreter_parser import get_events, ParsingError
import time
import datetime
from pathlib import Path
from io import BytesIO
from reconciliationScript import convert_files

app = Flask(__name__)
CORS(app)

def validation_check(id):
    regexcheck = re.compile("^(?!UC_)(?!.*__)(?!.*[^A-Za-z_0-9])(?!.*_$)[A-Z][A-Za-z_0-9]*")
    returnValue = regexcheck.fullmatch(id)
    if returnValue is None:
        return False
    else:
        return True

def wait_exists(filename, wait_time=0.25, wait_max=1):
    """wait_exists(filename, wait_time=0.25, wait_max=1) -> bool

       This functions waits for the specified max time (sleeping for the
       specified wait time each iteration until either the time expires or
       the file exists. If the file exists, this returns true.
    """
    wait_counter = 0
    while not os.path.exists(filename):
        time.sleep(wait_time)
        wait_counter += wait_time
        if wait_counter > wait_max:
            break

    return os.path.exists(filename)

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

def delete_writeable_model(fileName) -> tuple[str,int]:
    def get_response(status_code: int):
        match status_code:
            case status.HTTP_204_NO_CONTENT as code:
                return 'Model Deleted', code
            case status.HTTP_403_FORBIDDEN as code:
                return 'Model is ReadOnly; not deleted', code
            case status.HTTP_404_NOT_FOUND as code:
                return 'Model not found', code
            case status.HTTP_500_INTERNAL_SERVER_ERROR as code:
                return "Can't open model; JSON file is corrupted!", code
            case _ as code:
                return "Received unhandled Status Code!", code
    if not os.path.exists(fileName):
        return get_response(status.HTTP_404_NOT_FOUND)
    try:
        with locked_open(fileName, 'r', fcntl.LOCK_EX) as fp:
            data = json.load(fp)
    except json.JSONDecodeError:
        logging.debug(f'File {fileName} is corrupted!')
        return get_response(status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not data['readOnly']:
        if os.path.exists(fileName):
            os.remove(fileName)
            return get_response(status.HTTP_204_NO_CONTENT)
        return get_response(status.HTTP_404_NOT_FOUND)
    return get_response(status.HTTP_403_FORBIDDEN)

class PubKey:
    val: str = ""

class AuthenticationError(BaseException):
    pass

def retrieve_public_key():
    if not os.environ.get("KC_PUBLIC_KEY_URI"):
        return ""
    key_location_uri = os.environ["KC_PUBLIC_KEY_URI"]
    r = requests.get(key_location_uri)
    if r.status_code == status.HTTP_200_OK:
        pbkey_raw = r.json()["public_key"]
        pbkey = f"-----BEGIN PUBLIC KEY-----\n{pbkey_raw}\n-----END PUBLIC KEY-----"
        return pbkey
    else:
        return ""

def decode_token(auth_token: str) -> dict:
    if not PubKey.val:
        PubKey.val = retrieve_public_key()
    if PubKey.val:
        public_key = PubKey.val
    else:
        token_data = {"info": {},
                      "username": "",
                      "token_status": "public_key_missing"}
        return token_data
    if not auth_token:
        token_data = {"info": {},
                      "username": "",
                      "token_status": "token_missing"}
        return token_data
    auth_token = auth_token.removeprefix('Bearer ').lstrip()
    try:
        token_info = jwt.decode(auth_token, key=public_key, algorithms=["RS256"])
        username = token_info['preferred_username']
        token_status = "valid"
    except InvalidTokenError:
        token_info = {}
        username = ""
        token_status = "invalid"
    token_data = {"info": token_info,
                  "username": username,
                  "token_status": token_status}
    return token_data

def validate_token(auth_token, test_username: str="user1") -> str:
    auth_disabled = os.environ.get("BACKEND_AUTH_ENABLED", "true") == "false"
    if auth_disabled and (not auth_token or "Bearer" in auth_token):
        return test_username
    data = decode_token(auth_token)
    if data["token_status"] == "valid":
        return data["username"]
    else:
        raise AuthenticationError(f'Error: token status = {data["token_status"]}!')

@app.route('/parser/<filename>', methods=['POST'])
def parse_file(filename: str):
    """
    Flask `POST` endpoint that accepts an uploaded text file and its filename.
    Response is a JSON object based on a predefined schema, with the parsed output.
    """
    token = request.headers.get('Authorization')
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    uct_file = request.files[filename]
    try:
        data = get_events(filename, uploaded_file=uct_file)
    except ParsingError as e:
        return str(e), status.HTTP_400_BAD_REQUEST
    return jsonify(data), status.HTTP_200_OK

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
            path_to_file = [Path(fileName)]
            try:
                convert_files(path_to_file)
                with locked_open(fileName, 'r', fcntl.LOCK_SH) as fp:
                    full_data = json.load(fp)
            except json.JSONDecodeError:
                res.append({'name': file.removesuffix('.json'), 'readOnly': 'CORRUPTED'})
                continue
            data = full_data['model']
            data['modelVersion'] = full_data.get('modelVersion', "")
            if ((full_data['lastModified'] < (time.time() - 4500)) and (full_data['readOnly'] != "")):
                full_data['readOnly'] = ""
                full_data['lastModified'] = time.time()
                with locked_open(fileName, 'w', fcntl.LOCK_EX) as fp:
                    json.dump(full_data, fp, indent=2)
                res.append({'name': data['name'], 'readOnly': "", 'lastModified': full_data['lastModified']})
            else:
                res.append({'name': data['name'], 'readOnly': full_data['readOnly'], 'lastModified': full_data['lastModified']})
    return jsonify(res)


@app.route('/model/<id>', methods=['GET'])
def get_model(id):
    token = request.headers.get('Authorization')
    tabId = request.headers.get('SessionTabId')
    testUser = request.headers.get('TestUsername', "user1")
    try:
        username = validate_token(token, test_username=testUser)
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
    data["modelVersion"] = (
        full_data.get("modelVersion", "")
    )
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

@app.route("/model/export/<id>", methods=["GET"])
def export_model(id: str):
    token = request.headers.get("Authorization")
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    fileName = os.path.join("models", id) + ".json"

    if not os.path.exists(fileName):
        return "No file of that name exists", status.HTTP_404_NOT_FOUND
    try:
        with locked_open(fileName, "r", fcntl.LOCK_EX) as fp:
            full_data = json.load(fp)
    except json.JSONDecodeError:
        return (
            "Can't open model; JSON file is corrupted!",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    json_contents = json.dumps(full_data, indent=2).encode("utf-8")

    return send_file(BytesIO(json_contents), download_name=f"{id}.json")


@app.route("/model/import/<filename>", methods=["POST"])
def import_model(filename: str):
    token = request.headers.get("Authorization")
    try:
        validate_token(token)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    model_file = request.files[filename]
    try:
        full_data = json.loads(model_file.read().decode("utf-8"))
    except json.JSONDecodeError:
        return (
            "Can't import model; JSON file is corrupted!",
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    model_name = full_data["model"]["name"]
    internal_filename = f"{model_name}.json"
    filepath = os.path.join("models", internal_filename)
    original_filepath = os.path.join("models", filename)
    original_model_name = model_name
    # if file exists, append a timestamp to the filename (or replace an existing one)
    if os.path.exists(filepath):
        now = datetime.datetime.now(datetime.timezone.utc)
        timestamp = now.strftime("%Y_%m_%d_%Hh%Mm%S")
        # example timestamp = "2024_11_06_09h47m30"
        existing_match = re.search(r"_([_0-9hm]{6,20})\.json", internal_filename)
        if existing_match:
            filepath = filepath.replace(existing_match.group(1), timestamp)
        else:
            filepath = f"{filepath.removesuffix('.json')}_{timestamp}.json"
        model_name = filepath.split("/")[-1].removesuffix(".json")
        full_data["model"]["name"] = model_name
    metadata = {
        "original": {
            "filepath": original_filepath,
            "model_name": original_model_name,
        },
        "new": {
            "filepath": filepath,
            "model_name": model_name,
        },
    }
    full_data["lastModified"] = time.time()
    data = full_data["model"]
    if not validation_check(data["name"]):
        return (
            "Model could not be imported due to an invalid name",
            status.HTTP_400_BAD_REQUEST,
        )

    full_data["readOnly"] = ""
    full_data["model"]["readOnly"] = False

    with locked_open(filepath, "w", fcntl.LOCK_EX) as fp:
        json.dump(full_data, fp, indent=2)

    all_data = {
        "model": data,
        "meta": metadata,
    }
    return jsonify(all_data), status.HTTP_201_CREATED

@app.route('/model/<id>', methods=['POST'])
def post_model(id):
    token = request.headers.get('Authorization')
    tabId = request.headers.get('SessionTabId')
    model_ver = os.environ["MODEL_VERSION"]
    testUser = request.headers.get('TestUsername', "user1")
    try:
        username = validate_token(token, test_username=testUser)
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
    testUser = request.headers.get('TestUsername', "user1")
    try:
        username = validate_token(token, test_username=testUser)
    except AuthenticationError as e:
        return str(e), status.HTTP_401_UNAUTHORIZED
    if not validation_check(id):
        return 'Model could not be created due to an invalid name', status.HTTP_400_BAD_REQUEST
    content_type = request.headers.get('Content-Type')
    if content_type == 'application/json':
        filename = os.path.join('models', id) + '.json'
        
        # if file exists, retrieve modelVersion from the JSON
        if wait_exists(filename):
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
            data['modelVersion'] = old_data.get('modelVersion', "")
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
    return delete_writeable_model(filename)
    
@app.route('/model/return', methods=['GET'])
def return_all_by_user():
    token = request.headers.get('Authorization')
    [sessionId, _] = request.headers.get('SessionTabId', '').split('/')
    testUser = request.headers.get('TestUsername', 'user1')
    try:
        username = validate_token(token, test_username=testUser)
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
            if full_data['readOnly'].startswith(f'{username}/{sessionId}/'):
                try:
                    unlock_model(fileName)
                except json.JSONDecodeError:
                    # model's JSON file is corrupted
                    continue
                res.append(fileName)
    return jsonify(
        {
            "message": f"{len(res)} model(s) returned!",
            "count": len(res),
        }
    ), status.HTTP_200_OK

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
            'idealFunctionality_name': data['idealFunctionality']['name'],
            'adversarialInterface': data['idealFunctionality']['basicAdversarialInterface']})

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

from backend import app
import pytest
from typing import Any
import json
from starlette import status
from flask.testing import FlaskClient
from flask import Response
from os import environ
from pathlib import Path

if "TEST_DATA_FN" in environ:
    TEST_DATA_PATH = Path(environ["TEST_DATA_FN"])
else:
    TEST_DATA_PATH = Path("./tests") / "testdata.json"
    environ["MODEL_VERSION"] = "1.1"
    environ["BACKEND_AUTH_ENABLED"] = "false"

@pytest.fixture(scope="module")
def client() -> FlaskClient:
    return app.test_client()


@pytest.fixture(scope="module")
def data() -> dict[str, Any]:
    with open(TEST_DATA_PATH, "rb") as f:
        return json.load(f)


def get_model(
    client: FlaskClient,
    id: str,
    username: str,
    tab_id: str,
    dummy_token: str = "",
    **client_kwds,
) -> Response:
    headers = {
        "SessionTabId": tab_id,
        "TestUsername": username,
        "Authorization": dummy_token,
    }
    print(f"Model ID = {id}")
    with client:
        return client.get(
            f"/model/{id}",
            headers=headers,
            **client_kwds,
        )


def create_model(
    client: FlaskClient,
    id: str,
    model_data: dict[str, Any],
    username: str,
    tab_id: str,
    dummy_token: str = "",
    **client_kwds,
) -> Response:
    headers = {
        "SessionTabId": tab_id,
        "TestUsername": username,
        "Authorization": dummy_token,
    }
    print(f"Model ID = {id}")
    with client:
        return client.post(
            f"/model/{id}",
            json=model_data,
            headers=headers,
            **client_kwds,
        )


def update_model(
    client: FlaskClient,
    id: str,
    full_data: dict[str, Any],
    new_data: dict[str, Any],
    username: str,
    tab_id: str,
    dummy_token: str = "",
    **client_kwds,
) -> Response:
    headers = {
        "SessionTabId": tab_id,
        "TestUsername": username,
        "Authorization": dummy_token,
    }
    print(f"Model ID = {id}")
    mod_data = full_data.copy()
    mod_data.update(new_data)
    with client:
        return client.put(
            f"/model/{id}",
            json=mod_data,
            headers=headers,
            **client_kwds,
        )


def delete_model(
    client: FlaskClient,
    id: str,
    dummy_token: str = "",
    **client_kwds,
) -> Response:
    print(f"Model ID = {id}")
    with client:
        return client.delete(
            f"/model/{id}",
            headers={
                "Authorization": dummy_token,
            },
            **client_kwds,
        )


def return_model(
    client: FlaskClient,
    id: str,
    model_data: dict[str, Any],
    dummy_token: str = "",
    **client_kwds,
) -> Response:
    print(f"Model ID = {id}")
    with client:
        return client.put(
            f"/model/return/{id}",
            json=model_data,
            headers={
                "Authorization": dummy_token,
            },
            **client_kwds,
        )


def refresh_model(
    client: FlaskClient,
    id: str,
    username: str,
    tab_id: str,
    dummy_token: str = "",
) -> Response:
    print(f"Model ID = {id}")
    resp = get_model(client, id, username, tab_id, dummy_token=dummy_token)
    if resp.status_code != status.HTTP_200_OK:
        return resp
    return update_model(
        client,
        id,
        resp.json,
        {},
        username,
        tab_id,
        dummy_token=dummy_token,
    )


class TestEndpoints:
    """Test all endpoints"""

    def test_index(self, client, data):
        with client:
            resp = client.get("/model")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json) >= len(data["models"])
        with client:
            resp = client.get("/model", headers={
                "Authorization": "invalid token"
            })
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_model_pos(self, client, data):
        model_id = data["ids"]["models"]["IdealOnly1"]
        resp = get_model(
            client,
            model_id,
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json["name"] == model_id
        assert not resp.json["readOnly"]
        model_id = data["ids"]["models"]["IdealOnly1"]
        resp = get_model(
            client,
            model_id,
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json["name"] == model_id
        assert not resp.json["readOnly"]
        resp2 = return_model(client, model_id, resp.json)
        assert resp2.status_code == status.HTTP_200_OK

    def test_get_model_neg(self, client, data):
        model_ids = [
            data["ids"]["models"]["CorruptedModel"],
            "MissingModel",
            data["ids"]["models"]["IdealOnly2"],
        ]
        resp = get_model(
            client,
            model_ids[0],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        resp = get_model(
            client,
            model_ids[1],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        resp = get_model(
            client,
            model_ids[2],
            "user1",
            data["tab_ids"][0],
            dummy_token="invalid token",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_post_model_pos(self, client, data):
        model_id = data["ids"]["models"]["PostTest1"]
        resp = create_model(
            client,
            model_id,
            data["postData"]["PostTest1"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json["name"] == model_id
        assert not resp.json["readOnly"]
        resp2 = delete_model(client, id=model_id)
        assert resp2.status_code == status.HTTP_200_OK

    def test_post_model_neg(self, client, data):
        model_id = data["ids"]["models"]["PostTest3"]
        resp = create_model(
            client,
            model_id.lower(),
            data["postData"]["PostTest3"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        resp = create_model(
            client,
            model_id,
            data["postData"]["PostTest3"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json["name"] == model_id
        resp = create_model(
            client,
            model_id,
            data["postData"]["PostTest3"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_412_PRECONDITION_FAILED
        resp = delete_model(client, id=model_id.lower())
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        resp = delete_model(client, id=model_id, dummy_token="invalid token")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        resp = delete_model(client, id=model_id)
        assert resp.status_code == status.HTTP_200_OK
        resp = delete_model(client, id=model_id)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        resp = create_model(
            client,
            model_id,
            data["postData"]["PostTest3"],
            "user1",
            data["tab_ids"][0],
            content_type="multipart/form-data",
        )
        assert resp.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        resp = create_model(
            client,
            model_id,
            data["postData"]["PostTest3"],
            "user1",
            data["tab_ids"][0],
            dummy_token="invalid token",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_put_model_pos(self, client, data):
        model_id = data["ids"]["models"]["PostTest2"]
        updated_id = data["ids"]["models"]["PutTest1"]
        resp = create_model(
            client,
            model_id,
            data["postData"]["PostTest2"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json["name"] == model_id
        assert not resp.json["readOnly"]
        resp2 = update_model(
            client,
            model_id,
            data["postData"]["PostTest2"],
            data["putData"][0],
            "user1",
            data["tab_ids"][0],
        )
        assert resp2.status_code == status.HTTP_201_CREATED
        assert resp2.json["name"] == updated_id
        assert not resp2.json["readOnly"]
        assert len(resp2.json["interfaces"]["messages"]) == len(
            data["putData"][0]["interfaces"]["messages"]
        )
        resp2 = delete_model(client, id=updated_id)
        assert resp2.status_code == status.HTTP_200_OK

    def test_put_model_neg(self, client, data):
        model_ids = [
            data["ids"]["models"]["PostTest4"],
            data["ids"]["models"]["PostTest5"],
            data["ids"]["models"]["CorruptedModel"],
            "MissingModel",
        ]
        resp = create_model(
            client,
            model_ids[0],
            data["postData"]["PostTest4"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json["name"] == model_ids[0]
        resp = create_model(
            client,
            model_ids[1],
            data["postData"]["PostTest5"],
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json["name"] == model_ids[1]
        updated_data = dict(data["putData"][1]).copy()
        resp = update_model(
            client,
            model_ids[0].lower(),
            data["postData"]["PostTest4"],
            updated_data,
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        resp = update_model(
            client,
            model_ids[2],
            data["postData"]["PostTest4"],
            updated_data,
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        resp = update_model(
            client,
            model_ids[3],
            data["postData"]["PostTest4"],
            updated_data,
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        resp = update_model(
            client,
            model_ids[0],
            data["postData"]["PostTest4"],
            updated_data,
            "user1",
            data["tab_ids"][0],
            content_type="multipart/form-data",
        )
        assert resp.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        resp = update_model(
            client,
            model_ids[0],
            data["postData"]["PostTest4"],
            updated_data,
            "user1",
            data["tab_ids"][0],
            dummy_token="invalid token",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        updated_data["name"] = "PostTest4"
        resp = update_model(
            client,
            model_ids[1],
            data["postData"]["PostTest5"],
            updated_data,
            "user1",
            data["tab_ids"][0],
        )
        assert resp.status_code == status.HTTP_412_PRECONDITION_FAILED
        resp = delete_model(client, id=model_ids[0])
        assert resp.status_code == status.HTTP_200_OK
        resp = delete_model(client, id=model_ids[1])
        assert resp.status_code == status.HTTP_200_OK

    def test_return_pos(self, client, data):
        model_ids = [
            data["ids"]["models"]["IdealOnly1"],
            data["ids"]["models"]["IdealOnly2"],
            data["ids"]["models"]["IdealOnly2"],
            data["ids"]["models"]["FullModel1"],
        ]
        tab_ids = data["tab_ids"]
        users = data["usernames"]
        responses = []
        for model_id, tab_id, user in zip(model_ids, tab_ids, users):
            resp = get_model(
                client,
                model_id,
                user,
                tab_id,
            )
            if resp.status_code == status.HTTP_200_OK and resp.json["name"] == model_id:
                responses.append(resp)
        assert len(responses) == len(model_ids)
        with client:
            resp2 = client.get(
                "/model/return",
                headers={
                    "SessionTabId": tab_ids[0],
                    "TestUsername": "user1",
                },
            )
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.json["message"].startswith(
            str(data["return_all_count"][0]["user1"])
        )
        resp2b = refresh_model(
            client,
            model_ids[2],
            "user1",
            tab_ids[2],
        )
        assert resp2b.status_code == status.HTTP_201_CREATED
        assert not resp2b.json["readOnly"]
        with client:
            resp3 = client.get(
                "/model/return",
                headers={
                    "SessionTabId": tab_ids[2],
                    "TestUsername": "user1",
                },
            )
        assert resp3.status_code == status.HTTP_200_OK
        assert resp3.json["message"].startswith(
            str(data["return_all_count"][1]["user1"])
        )
        with client:
            resp4 = client.get(
                "/model/return",
                headers={
                    "SessionTabId": tab_ids[3],
                    "TestUsername": "user2",
                },
            )
        assert resp4.status_code == status.HTTP_200_OK
        assert resp4.json["message"].startswith(
            str(data["return_all_count"][0]["user2"])
        )

    def test_return_neg(self, client, data):
        model_ids1 = [
            data["ids"]["models"]["IdealOnly1"],
            data["ids"]["models"]["FullModel1"],
        ]
        model_ids2 = [
            data["ids"]["models"]["CorruptedModel"],
            "MissingModel",
        ]
        tab_ids = data["tab_ids"][:2]
        users = data["usernames"][:2]
        responses = []
        for model_id, tab_id, user in zip(model_ids1, tab_ids, users):
            resp = get_model(
                client,
                model_id,
                user,
                tab_id,
            )
            if resp.status_code == status.HTTP_200_OK and resp.json["name"] == model_id:
                responses.append(resp)
        assert len(responses) == len(model_ids1)
        resp = return_model(client, model_ids2[0], responses[0].json)
        assert resp.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        data_readonly = responses[0].json.copy()
        data_readonly["readOnly"] = True
        resp = return_model(client, model_ids1[0], data_readonly)
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        resp = return_model(client, model_ids2[1], responses[0].json)
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        resp = return_model(client, model_ids1[0], responses[0].json, dummy_token="invalid token")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
        with client:
            resp2 = client.get(
                "/model/return",
                headers={
                    "SessionTabId": tab_ids[0],
                    "TestUsername": "user1",
                },
            )
        assert resp2.status_code == status.HTTP_200_OK
        assert resp2.json["message"].startswith("2")

    def test_get_ifs_pos(self, client, data):
        with client:
            resp = client.get("/model/idealFunctionalities")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json) >= len(data["models"])

    def test_get_if_messages_pos(self, client, data):
        if_ids = [
            data["ids"]["IFs"]["IdealOnly1"],
            data["ids"]["IFs"]["IdealOnly2"],
        ]
        message_counts = [
            data["messageCounts"]["IFs"]["IdealOnly1"],
            data["messageCounts"]["IFs"]["IdealOnly2"],
        ]
        responses = []
        num_messages = []
        with client:
            for if_id in if_ids:
                resp = client.get(f"/model/idealFunctionalities/{if_id}/messages")
                if resp.status_code == status.HTTP_200_OK:
                    responses.append(resp)
                    num_messages.append(len(resp.json))
        assert len(responses) == len(if_ids)
        assert num_messages == message_counts

    def test_get_comps_pos(self, client, data):
        with client:
            resp = client.get("/model/compInterfaces")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json) >= data["compInterCount"]

    def test_get_comp_messages_pos(self, client, data):
        comp_ids = [
            *data["ids"]["compInters"]["IdealOnly1"],
            *data["ids"]["compInters"]["IdealOnly2"],
        ]
        message_counts = [
            *data["messageCounts"]["compInters"]["IdealOnly1"],
            *data["messageCounts"]["compInters"]["IdealOnly2"],
        ]
        responses = []
        num_messages = []
        with client:
            for comp_id in comp_ids:
                resp = client.get(f"/model/compInterfaces/{comp_id}/messages")
                if resp.status_code == status.HTTP_200_OK:
                    responses.append(resp)
                    num_messages.append(len(resp.json))
        assert len(responses) == len(comp_ids)
        assert num_messages == message_counts

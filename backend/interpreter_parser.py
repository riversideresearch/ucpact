#!/usr/bin/env python

import sys
import re
import json
from uuid import uuid4


class LinePatterns:
    """RegEx compiled patterns to test on a per-line basis."""

    curr_state = re.compile(r"^#(\d+)>")
    real_world = re.compile(r"^real world:")
    ideal_world = re.compile(r"^ideal world:")
    file_position = re.compile(r"^UC file position: (.+?) (\d+) (\d+);")
    error_event = re.compile(r"\[error: (.+)\]")
    fail_event = re.compile(r'^note: "fail\."')
    from_env = re.compile(r"^sending from (environment)")
    from_adv = re.compile(r"^sending from (adversary)")
    from_world = re.compile(r"^sending from (.+)")
    message = re.compile(r"^message:")
    message_to = re.compile(r"^message was output: *(\w+):")
    adv_fport = re.compile(r".+: *\((\(adv.+?\))\)@")
    adv_tport = re.compile(r"@.+?@\((\(adv.+?\))\)")
    world_fport = re.compile(r".+: *\((\(func.+?\))\)@")
    world_tport = re.compile(r"@.+?@\((\(func.+?\))\)")
    env_fport = re.compile(r".+: *\(?(.+?)\)?@")
    env_tport = re.compile(r"@.+?@\(?(.+)\)?")
    name_and_params = re.compile(r"@(.+?)(\((.+)\))?@")
    assert_msg = re.compile(r"^assert ")


class ParsingError(BaseException):
    pass


def iter_states(fn: str, uploaded_file=None):
    """Iterates through each state indicator (starting from #1>)."""
    if uploaded_file is not None:
        content = uploaded_file.read().decode("utf-8").splitlines()
    else:
        with open(fn, mode="r") as f:
            content = f.readlines()
    raw_matches = [re.search(LinePatterns.curr_state, line) for line in content]
    clean_matches = [
        (match, line_no)
        for line_no, match in enumerate(raw_matches)
        if match is not None
    ]
    start_line = 0
    curr_state = 0
    for match, line_no in clean_matches:
        if line_no > start_line:
            yield {
                "text": content[start_line:line_no],
                "from": start_line + 1,
                "to": line_no + 1,
                "state": curr_state,
            }
        start_line = line_no
        curr_state = int(match.group(1))
    if start_line < len(content):
        yield {
            "text": content[start_line:],
            "from": start_line + 1,
            "to": len(content),
            "state": curr_state,
        }


def parse_states(fn: str, **kwds):
    """Parses states one at a time as retrieved from `iter_states(fn)`"""
    is_realworld = None
    for state_data in iter_states(fn, **kwds):
        from_entity = None
        sent_from = None
        has_message = False
        has_fail = False
        error_message = None
        message_content = {}
        to_message_content = {}
        in_message1 = False
        in_message2 = False
        has_assert = False
        file_positions = []
        for line in state_data["text"]:
            file_position = re.search(LinePatterns.file_position, line)
            error_event = re.search(LinePatterns.error_event, line)
            fail_event = re.search(LinePatterns.fail_event, line) is not None
            from_real = re.search(LinePatterns.real_world, line) is not None
            from_ideal = re.search(LinePatterns.ideal_world, line) is not None
            sent_from_env = re.search(LinePatterns.from_env, line)
            sent_from_adv = re.search(LinePatterns.from_adv, line)
            sent_from_world = re.search(LinePatterns.from_world, line)
            assert_check = re.search(LinePatterns.assert_msg, line)
            if assert_check is not None: # Ignores the states that contain the assert message in the script
                has_assert = True
            if file_position is not None:
                file_pos = {
                    "filename": file_position.group(1),
                    "start": int(file_position.group(2)),
                    "end": int(file_position.group(3)),
                }
                file_positions.append(file_pos)
            has_fail = has_fail or fail_event
            if error_event is not None:
                error_message = error_event.group(1)
            if from_entity is None:
                if sent_from_env:
                    from_entity = "Env"
                    sent_from = sent_from_env.group(1)
                elif sent_from_adv:
                    from_entity = "Adv"
                    sent_from = sent_from_adv.group(1)
                elif sent_from_world:
                    from_entity = "World"
                    sent_from = sent_from_world.group(1)
            message_tag = re.search(LinePatterns.message, line)
            to_message_tag = re.search(LinePatterns.message_to, line)
            is_realworld = True if from_real else is_realworld
            is_realworld = False if from_ideal else is_realworld
            has_message = has_message or (
                message_tag is not None or to_message_tag is not None
            )
            if message_tag is not None:
                in_message1 = True
                first_line = line
                message_content["tag"] = message_tag.group(0)
                message_content["text"] = [first_line.strip()]
            elif in_message1:
                if line.strip() != ";":
                    message_content["text"].append(line.strip())
                else:
                    in_message1 = False
            if to_message_tag is not None:
                in_message2 = True
                first_line = line
                to_message_content["tag"] = to_message_tag.group(0)
                to_message_content["to"] = to_message_tag.group(1)
                to_message_content["text"] = [first_line.strip()]
            elif in_message2:
                if line.strip() != ";":
                    to_message_content["text"].append(line.strip())
                else:
                    in_message2 = False
        if ((has_message or has_fail or error_message is not None) and not has_assert):
            state = {
                "num": state_data["state"],
                "text": state_data["text"],
                "eventType": "message" if has_message else "fail" if has_fail else "error",
                "ucfilePosition": file_positions,
                "firstline": state_data["from"] + 1,
                "world": "real" if is_realworld else "ideal",
                "errorMessage": error_message,
                "message": message_content if message_content else to_message_content,
                "fromEntity": from_entity,
                "sentFrom": sent_from,
            }
            yield state
        else:
            pass


def get_events(fn: str, **kwds):
    """Parses events one at a time as retrieved from `parse_states(fn)`"""
    json_data = {
        "filename": fn,
        "realWorld": {
            "events": [],
        },
        "idealWorld": {
            "events": [],
        },
    }
    for state in parse_states(fn, **kwds):
        state_no = state["num"]
        event_data = {
            "type": state["eventType"],
            "errorMessage": state["errorMessage"],
            "ucfilePosition": state["ucfilePosition"],
            "name": None,
            "parameters": [],
            "stateNumber": state_no,
            "toEntity": None,
            "fromEntity": state["fromEntity"],
            "id": str(uuid4()),
            "toPort": None,
            "fromPort": None,
            "startLine": state["firstline"],
            "outputTo": None,
            "sentFrom": state["sentFrom"],
        }
        if event_data["type"] != "message":
            if state["world"] == "real":
                json_data["realWorld"]["events"].append(event_data)
            else:
                json_data["idealWorld"]["events"].append(event_data)
            continue
        try:
            event_data["outputTo"] = state["message"]["to"]
        except KeyError:
            pass
        message_content = "".join(state["message"]["text"])
        # message_tag = state['message']['tag']
        adv_fport_match = re.search(LinePatterns.adv_fport, message_content)
        adv_tport_match = re.search(LinePatterns.adv_tport, message_content)
        world_fport_match = re.search(LinePatterns.world_fport, message_content)
        world_tport_match = re.search(LinePatterns.world_tport, message_content)
        env_fport_match = re.search(LinePatterns.env_fport, message_content)
        env_tport_match = re.search(LinePatterns.env_tport, message_content)
        if adv_fport_match:
            fport = adv_fport_match
            port_inferred_entity = "Adv"
        elif world_fport_match:
            fport = world_fport_match
            port_inferred_entity = "World"
        elif env_fport_match:
            fport = env_fport_match
            port_inferred_entity = "Env"
        else:
            raise ParsingError(f"fromPort not found in state {state_no}!")
        if event_data["fromEntity"] is None:
            event_data["fromEntity"] = port_inferred_entity
        if adv_tport_match:
            tport = adv_tport_match
            event_data["toEntity"] = "Adv"
        elif world_tport_match:
            tport = world_tport_match
            event_data["toEntity"] = "World"
        elif env_tport_match:
            tport = env_tport_match
            event_data["toEntity"] = "Env"
        else:
            raise ParsingError(f"toPort not found in state {state_no}!")
        event_data["fromPort"] = fport.group(1)
        event_data["toPort"] = tport.group(1)
        name_and_params = re.search(LinePatterns.name_and_params, message_content)
        if name_and_params:
            event_data["name"] = name_and_params.group(1)
            event_data["parameters"] = parse_params(
                name_and_params.group(3),
                state_no,
            )
        else:
            raise ParsingError(
                f"message name or parameters not found in state {state_no}"
            )
        if state["world"] == "real":
            json_data["realWorld"]["events"].append(event_data)
        else:
            json_data["idealWorld"]["events"].append(event_data)
    return json_data


def parse_params(content, debug_state: int):
    params = []
    parenth_level = 0
    k1 = 0
    if content is None:
        return []
    for k2 in range(len(content)):
        if content[k2] == "(":
            parenth_level += 1
        elif content[k2] == ")":
            parenth_level -= 1
        elif content[k2] == "," and parenth_level == 0:
            params.append(content[k1:k2].strip())
            k1 = k2 + 1
        else:
            pass
        if parenth_level < 0:
            raise ParsingError(f"Unbalanced parentheses in state {debug_state}!")
    if parenth_level != 0:
        raise ParsingError(f"Unbalanced parentheses in state {debug_state}!")
    if k1 < len(content):
        params.append(content[k1:].strip())
    return params


def save_to_json(data, out_fn: str = "output.json"):
    """Save output data to a json file for testing purposes."""
    with open(out_fn, "w") as fp:
        json.dump(data, fp, indent=2)


def split_worlds(fn: str):
    """Test function that splits the real and ideal worlds into separate files."""
    real_content = []
    ideal_content = []
    for state in parse_states(fn):
        if state["world"] == "real":
            real_content.extend(state["text"])
        else:
            ideal_content.extend(state["text"])
    if "full" in fn:
        real_fn = fn.replace("full", "real")
        ideal_fn = fn.replace("full", "ideal")
    else:
        name, ext = fn.split(".")
        real_fn = ".".join([name + "_real", ext])
        ideal_fn = ".".join([name + "_ideal", ext])
    with open(real_fn, "w") as realf:
        realf.write("".join(real_content))
    with open(ideal_fn, "w") as idealf:
        idealf.write("".join(ideal_content))
    print("Files split!")


if __name__ == "__main__":
    _, fname_in, fname_out = sys.argv[:3]
    # split_worlds(fname_in)
    data = get_events(fname_in)
    save_to_json(data, fname_out)

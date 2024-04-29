![logo](frontend/public/images/logo_blue-green-for-light-background.png)

# UC-PACT

---

This repository is used to generate UC DSL in a web-based graphical user interface.
When run via docker compose, both the frontend and backend are built and then run in docker containers.

## How to use this repo

It is fairly simple to get UC-PACT up and running. Simply run
`docker compose --profile default build` followed by `docker compose --profile default up`.

If run in daemon mode, you can bring down the containers by running
`docker compose --profile default down`.

For development mode (avoids the need to build the frontend again after minor edits), use
`docker compose --profile dev build` once, and then `docker compose --profile dev up -d`.

To run tests (does not use Keycloak), use `docker compose --profile tests build` once, and then `docker compose --profile tests up`.  The tests will run automatically.

## How to access Keycloak admin UI

To access the admin UI for `Keycloak`, go to [http://localhost:8080/admin](http://localhost:8080/admin)
and login with `username="admin" & password="admin"`.

### Adding a new user

To add a new user, first switch the realm in the upper left corner from `master` to `UCPACT-Realm`. Next, in the left navigation, click `Users`. Next click `Add User`. Only the username is a required field. Enter it, and click `Create`.

After clicking `Create`, you should have new options above. Click `Credentials` and `Set password`. Enter a password and toggle off `Temporary` as to not be prompted to change the password later.

Navigate to [http://localhost/](http://localhost/) and sign in to UC-PACT with the username and password you created.

## Deployment Notes

* **Be sure to change Keycloak's `admin` password within `docker-compose.yml` before deployment!**

## Contact

---

You can contact the UC-PACT team by reaching out to INSERTEMAILHERE

For more information about Universal Composability and the UC DSL see the [EasyUC](https://github.com/easyuc/EasyUC/tree/master) repository.

---

ACKNOWLEDGMENT

This material is based upon work supported by the Defense Advanced Research Projects Agency (DARPA) under Contract No. N66001-22-C-4020. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the Defense Advanced Research Projects Agency (DARPA).

Distribution Statement "A" Pending (Not Approved for Public Release, Distribution not Unlimited)

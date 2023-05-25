# intelliQ 📃
A full-stack intelligent questionnaire application.  
https://intelliq.site

Semester project repository for the 2022-2023 Software Engineering course.

School of Electrical and Computer Engineering  
National Technical University of Athens

## Build Instructions
> 🐳 If you have **[Docker](https://www.docker.com/)** installed, simply clone and run `docker compose up`.  
Otherwise you may find manual instructions for each component below.

### API Backend Application
1. Download and install [Node.js](https://nodejs.org/).
2. Install PM2 through NPM:
	```shell
	$ npm install pm2 -g
	```
3. Install required modules:
	```shell
	$ cd api-backend
	$ npm install express mariadb multer https json2csv cors swagger-ui-express
	```
4. Open [config.js](api-backend/config.js) and configure the application.
	- In order to use the HTTPS server, an SSL certificate is required. You may find instructions on how to create one yourself [below](#creating-a-self-signed-ssl-certificate).
5. Start as a daemon:
	```shell
	$ pm2 start app.js --name intelliQ-API
	```

### Command Line Interface
#### UNIX systems
Prerequisites: [python3](https://www.python.org/), python3-venv

1. Create a virtual environment in the directory of your choosing and activate it in your shell:
	```shell
	$ python3 -m venv <venv_name>
	$ source <venv_name>/bin/activate
	```
2. Change to the [cli](/cli) directory and install dependencies:
	```shell
	$ cd cli
	$ pip install -e .
	```
3. Every time you wish to use the CLI, just activate the virtual environment you created:
	```shell
	$ source <venv_name>/bin/activate
	```

> You may choose not to use a virtual environment, however dependencies will be installed globally that way.

The CLI is accessible through the `se2226` alias in the virtual environment.

**Use the ``se2226 set-server`` command to set the API server for making calls to (default: ``localhost:9103``).**

### Database
This implementation of the intelliQ specification is compatible with MariaDB.
The installation and configuration process for MariaDB differs depending on the operating system.  
Please refer to the [official documentation](https://mariadb.com/kb/en/getting-installing-and-upgrading-mariadb/) for instructions.

__Make sure to initialise the database using [schema.sql](scripts/mariadb/schema.sql):__
```shell
$ mysql -u <user> [-p] < scripts/mariadb/schema.sql
```

### Frontend
You may use the web server of your choise ([Apache](https://httpd.apache.org/), [Nginx](https://www.nginx.com/), ..)  
Simply drag and drop the contents of the [frontend](frontend/) folder into the document root directory of your site.

__You will need to configure the server URL to use for API queries depending on your deployment. Please refer to [config.js](frontend/js/config/config.js)__

## Creating a self-signed SSL certificate
```shell
$ openssl genrsa -out key.pem
$ openssl req -new -key key.pem -out csr.pem
$ openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem
```

## Testing
### API Application
A [Postman](https://www.postman.com/) version 2.1 collection file can be found [here](test/api-backend/intelliQ-API.postman_collection.json).  
This collection includes the full API structure and thorough test scripts which may be used to verify correct functionality of the service.

### Command Line Interface
CLI unit tests can be performed using the pytest library with [test_unit_cli.py](cli/test_unit_cli.py). To run the unit tests, navigate to the [cli/](cli/) directory and run ``$ pytest [-v]``.  
A CLI functional test is located in [functional_test_cli.py](test/cli/functional_test_cli.py). To run it use ``$ python3 cli/functional_test_cli.py``.  
CLI tests can also be performed using the [cli_tests.sh](test/cli/cli_tests.sh) shell script.

## API Documentation
API documentation is available in OpenAPI 3.0 format [here](https://app.swaggerhub.com/apis/ntua-el19608/intelliQ-API/1.0.0).  
It is included in the API application and enabled by default. You can find it at ``{API_HOST}/docs``.  
An instance is also available on the [live demo server](https://api.intelliq.site/docs).

## Project Team
| Full Name                                                | Registration Number |
| -------------------------------------------------------- | ------------------- |
| [Ioannis Basdekis](https://github.com/johnbas321  )      | 03119198            |
| [Ioannis Dressos](https://github.com/idressos)           | 03119608            |
| [Kriton Iordanidis](https://github.com/kritonios01)      | 03119604            |
| [Panteleimon Emmanouil](https://github.com/PantelisEmm ) | 03119018            |
| [Panagiotis Tsakonas](https://github.com/pantsa01)       | 03119610            |

# A2JDAT

This repo hosts the distributable production version of the A2J Document Assembly Tool (DAT). The document assembly tool is an optional piece of software used for producing pdf documents at the end of interviews. It requires the A2Jviewer, wkhtmltopdf and nodejs 8+ to run properly. The recommended additional tools for windows are nvm and iisnode. The recommended additional tools for \*nix servers are nvm and pm2.

DAT versions installed before 1.0.0 use a template format that is mutually incompatible with this version. Old templates will neeed to be converted by uploading to staging.a2jauthor.org and republishing.

Within this repo and releases you'll find a `.zip` file containing the JavaScript source for the DAT and sample configuration files

NOTE: By downloading this application, you are agreeing to the terms included in the user license [LICENSE.md](https://github.com/CCALI/A2JDAT/blob/master/LICENSE.md).

## Known Good Hosting Environments
The DAT requires nodejs 8+. Any system supporting nodejs 8+ is supported. It has been tested on ubuntu 14 and 16, centos, and Windows Server 2016 on Azure with apache and IIS

While other server environments may work, they have not been tested.  Should you get another hosting environment working, please do a Pull Request at the hosted [A2J DAT](https://github.com/CCALI/A2JDAT) repo to let us know any steps taken so that we may share with others.

## Upgrading

For \*nix based systems, if you followed the previous instructions simply follow these steps:

1.) Download the code either through git or releases

2.) run the following commands in sequence to transpile the sources
```
cd DAT
npm install
cd js
npm install bootstrap
cd ..
npm run build
npm run build:server
```

3.) Update config.json
A new required key, "VIEWER_PATH", has been added to config.json which tells the DAT software the location of the viewer. An example of config.json for windows with the new key is below.
a sample config.json for linux is below:

```
{
  "SERVER_URL": "http://localhost",
  "GUIDES_DIR": "/var/www/example.com/a2j-viewer/guides",
  "GUIDES_URL": "/a2j-viewer/guides",
  "SQL_HOST": "localhost",
  "SQL_USERNAME": "root",
  "SQL_PASSWD": "root",
  "SQL_DBNAME": "caja",
  "SQL_PORT": 3306,
  "DRUPAL_HOST": "localhost",
  "DRUPAL_USERNAME": "root",
  "DRUPAL_PASSWD": "root",
  "DRUPAL_DBNAME": "D7commons",
  "DRUPAL_PORT": 3306,
  "WKHTMLTOPDF_PATH": "/usr/bin/local/wkhtmltopdf",
  "VIEWER_PATH": "/var/www/example.com/a2j-viewer"
}
```

4.) Templates must be uploaded and republished to your server


## Installation instructions

1.)  Install nvm
The DAT is a simple restful API that requires nodejs to serve endpoints. Though, you are free to install the node version that the DAT targets and manage it manually the recommended method is to use a node version manager which will allow the simultaneous installation of multiple versions of node and mitigates certain administration issues.

Obtain nvm for windows here: https://github.com/coreybutler/nvm-windows

For \*nix go here:
https://github.com/creationix/nvm

2.) Install node through nvm
after installation of nvm, type the following commands in the terminal to install the required node version

```
nvm install 8.9.4
nvm use 8.9.4
```

check that the install was successful by typing

`node -v`

which should produce the version number of node we installed

3.) Install Git if not installed

Git is a source control manager and required for npm. Install Git by downloading latest from
https://git-scm.com/download/


4.) Install build tools

To build the dat you must install a c++ compiler and python 2.7

you must also install the folowing build tools:

npm install node-pre-gyp babel-cli steal-tools -g


5.) Install wkhtmltopdf
WKHTMLTOPDF is the engine used to transform interview data into PDF from an intermediate HTML file. Download the latest stable version from https://wkhtmltopdf.org/downloads.html  and install it in the environment. Make a note of the install path.

6.) Install node process manager

For Windows and IIS:
The recommended process manager is iisnode
https://github.com/tjanczuk/iisnode
https://github.com/tjanczuk/iisnode/releases

For \*nix:
The recommended process manager is pm2 (http://pm2.keymetrics.io/). Install it with the following command

`npm install pm2 -g`

7.) Download the latest DAT from repo. It is recommended that you install the latest release from the releases page. These releases are compiled to target node 8.9.4. If you are running a different version of node, you will need to download the source and compile by following the instructions **compile from source instructions**.

8.) Unzip the DAT package into your webroot or preferred directory on your web server.

9.) Configure DAT
Since the A2J software can run on many platforms, there is a small amount of platform specific configuration that is necessary. Navigate to the root of the DAT in your websites folder. Open config.json

The Most important keys are:
SERVER_URL- required to establish target endpoints for API
GUIDES_DIR-  required to establish location of templates
GUIDES_URL- relative web location of guides
WKHTMLTOPDF_PATH- path to binary of WKHTMLTOPDF
A new required key, "VIEWER_PATH", has been added to config.json which tells the DAT software the location of the viewer. An example of config.json for windows with the new key is below.
All other keys must be present but the value is irrelevant.

Ensure that the value for the key WKHTMLTOPDF_PATH matches the path noted above where WKHTMLTOPDF is installed. Backslashes are special characters in json so each backslash must be typed twice to escape them and work properly.

a sample config.json for windows is below:
```
{
  "SERVER_URL": "http://localhost",
  "GUIDES_DIR": "C:\\inetpub\\wwwroot\\a2j-viewer\\guides",
  "GUIDES_URL": "/a2j-viewer/guides",
  "SQL_HOST": "localhost",
  "SQL_USERNAME": "root",
  "SQL_PASSWD": "root",
  "SQL_DBNAME": "caja",
  "SQL_PORT": 3306,
  "DRUPAL_HOST": "localhost",
  "DRUPAL_USERNAME": "root",
  "DRUPAL_PASSWD": "root",
  "DRUPAL_DBNAME": "D7commons",
  "DRUPAL_PORT": 3306,
  "WKHTMLTOPDF_PATH": "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf",
  "VIEWER_PATH": "C:\\inetpub\\wwwroot\\a2j-viewer\\viewer\\"
}
```

a sample config.json for linux is below:
```
{
  "SERVER_URL": "http://localhost",
  "GUIDES_DIR": "/var/www/example.com/a2j-viewer/guides",
  "GUIDES_URL": "/a2j-viewer/guides",
  "SQL_HOST": "localhost",
  "SQL_USERNAME": "root",
  "SQL_PASSWD": "root",
  "SQL_DBNAME": "caja",
  "SQL_PORT": 3306,
  "DRUPAL_HOST": "localhost",
  "DRUPAL_USERNAME": "root",
  "DRUPAL_PASSWD": "root",
  "DRUPAL_DBNAME": "D7commons",
  "DRUPAL_PORT": 3306,
  "WKHTMLTOPDF_PATH": "/usr/bin/local/wkhtmltopdf",
  "VIEWER_PATH": "/var/www/html/mysite.com/a2j-viewer/viewer/"
}
```

10.) Configure the server

The DAT is a simple restful interface with endpoints located at <host>/api/. Requests must be routed through the node /bin/www target. We will setup a reverse proxy to accomplish this.

for IIS/Windows below is an example web.config
```
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <handlers>
            <add name="iisnode" path="DAT/bin/www" verb="*" modules="iisnode" />
        </handlers>
        <rewrite>
          <rules>
            <rule name="myapp">
              <match url="(api/.*)" />
              <action type="Rewrite" url="DAT/bin/www/{R:1}" />
            </rule>
          </rules>
        </rewrite>
        <security>
            <requestFiltering>
                <hiddenSegments>
                    <remove segment="bin" />
                </hiddenSegments>
            </requestFiltering>
        </security>
    </system.webServer>
</configuration>
```

for apache add the following directives to your site config

```
ProxyPass /api http://localhost:3000/api
ProxyPassReverse /api http://localhost:3000/api
ProxyBadHeader Ignore
```

for nginx add the following directives
```
Location /api {
    Proxy_pass http://127.0.0.1:3000/
}
```

11.)  Start the node process
for \*nix
navigate to the DAT folder in a terminal

`pm2 start npm --name “prod-api” -- run start`

## Compile from source instructions
This section assumes you installed the node dependencies in the previous section.

1.) Download the latest source code from the github repo at https://github.com/ccali/a2jdat

2.) navigate to the downloaded location in a terminal

3.)  run the following commands in sequence
```
cd DAT
npm install
cd js
npm install bootstrap
cd ..
npm run build
npm run build:server
```

if you encounter an error in this step it can often be resolved by deleting node_modules in DAT and DAT\\js and repeating the step.

## Security Note
This software uses a version of jquery with a known security vulnerability. The features required to exploit this vulnereability are not used in this software and hence it is not an issue.

## More info

To find out more about A2J Viewer and A2J Author® please see our website, [www.a2jauthor.org](https://www.a2jauthor.org/)

For questions, contact Tobias Nteireho at tobias@cali.org

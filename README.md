# A2JDAT

This repo hosts the distributable production version of the A2J Document Assembly Tool (DAT). The document assembly tool is an optional piece of software used for producing pdf documents at the end of interviews. It requires the A2Jviewer, wkhtmltopdf and nodejs 12+ to run properly. The recommended additional tools for windows are nvm and iisnode. The recommended additional tools for \*nix servers are nvm and pm2.

Within this repo and releases you'll find a `.zip` file containing the minified JavaScript source for the DAT and sample configuration files

NOTE: By downloading this application, you are agreeing to the terms included in the user license [LICENSE.md](https://github.com/CCALI/a2jdat/blob/develop/LICENSE.md).

## Hosting
The DAT requires nodejs 12. Any system supporting nodejs 12 is supported. It has been tested on ubuntu 18, centos, and Windows Server 2016 on Azure with apache and IIS

While other server environments may work, they have not been tested.  Should you get another hosting environment working, please do a Pull Request at the hosted [A2J DAT](https://github.com/CCALI/a2jdat) repo to let us know any steps taken so that we may share with others.

## Upgrade notes/summary from node A2JDAT v2

**The folder structure has changed.** It is recommended that your current setup is backed up. This means at a minimum, config.json and ecosystem.config.js. Alternatively you may checkout/unzip this repo into  a new folder.

The folder structure has changed such that the DAT is no longer a sub folder.

Old structure
```
Containing Folder
-A2JDAT
--DAT
-config.js
-ecosystem.js
```

Current required structure:
```
Containing Folder
-config.js
-ecosystem.config.js
-A2JDAT (this DAT repo)
```

**The WKHTMLTOPDF_ZOOM settings have changed. YOU MUST SET THIS CORRECTLY TO MATCH PDFs GENERATED ON A2JAUTHOR.ORG**  On most \*nix systems this should be 1.6711 and on most windows systems this should be 1.5709.

Assuming you have all up-to-date dependencies (wkhtmltopdf, node, npm, pm2) you can run
`npm run deploy`
and skip to step 13 of installation instructions for calibration

## General Installation instructions

#### All Platforms + common solutions to common problems
For all platforms this document should work as written. You can skip to `step 4` of `Installation Instructions` for systems with working DAT setup. Starting from `step 1` may upgrade those DAT subdependencies which is expected to cause no issues.

This document should work as written but some components will likely need to be recompiled for the current node 12.

if the DAT does not properly start after using these instructions, the likely culprit is `humus`. This will be indicated by running `pm2 logs` and seeing a node version error. To rectify
follow the instructions below:

1.) go to the `a2jdat` folder

2.) run `npm install humus` in a command line

3.) restart DAT process and test

## Installation instructions

1.)  Install nvm
The DAT is a simple restful API that requires nodejs to serve endpoints. Though, you are free to install the node version that the DAT targets and manage it manually, the recommended method is to use a node version manager which will allow the simultaneous installation of multiple versions of node and mitigates several administration issues.

Obtain nvm for windows here: https://github.com/coreybutler/nvm-windows

For \*nix go here: https://github.com/creationix/nvm

2.) Install node through nvm
after installation of nvm, type the following commands in the terminal to install the required node version

```
nvm install 12.20.1
nvm use 12.20.1
```

check that the install was successful by typing

`node -v`

which should produce the version number of node we installed, `12.20.1`

#### For Windows Users:

##### Ensure Node is in PATH:
The node installer might not always set the PATH variable correctly. Check Environment variables to ensure that there is an entry for the folder containing node.exe.  For this tutorial that folder is C:\Program Files\nodejs\.

##### Configure Node Permissions:
Node.exe must be added to the IIS_IUSRS group in order to be allowed to handle requests. This must occur every time the node executable is switched through nvm. Open a command prompt and run as administrator and run
```icacls “%programfiles%\nodejs\node.exe” /grant IIS_IUSRS:rx```


3.) Install global DAT dependencies and subdependencies:

Git is a source control manager and required for npm. This can be obtained through most \*nix package managers. For windows, install Git by downloading latest from
https://git-scm.com/download/win
As of this documents writing, the latest version for the system in the azure demo environment is located at:
https://github.com/git-for-windows/git/releases/download/v2.30.1.windows.1/Git-2.30.1-64-bit.exe

4.) Install build tools:

The node sub-dependencies for the DAT must be built locally on the target system and requires build tools for languages other than node. Run the command below to install the necessary build tools:

##### For windows
use the command below to install
```npm --add-python-to-path='true' --debug install --global windows-build-tools```

This requires administrator access. This is a very lengthy install-  it can take over an hour even on a fast machine with a fantastic connection.

#### For all platforms run the command below

```npm install node-pre-gyp babel-cli steal-tools -g```


5.) Install wkhtmltopdf
WKHTMLTOPDF is the engine used to transform interview data into PDF from an intermediate HTML file. Download the latest stable version from https://wkhtmltopdf.org/downloads.html  and install it in the VM. *Make a note of the install path*.

6.) Install node process manager
The node process manager handles automatic restarts, memory mangement, monitoring, and error logging.

For All platforms:
The recommended process manager is pm2 (http://pm2.keymetrics.io/). Install it with the following command

`npm install pm2 -g`

##### Notes to Windows users about iisnode:
a.) Older versions of this project used iisnode (https://github.com/tjanczuk/iisnode) iisnode is no longer supported. For migration instructions go here: https://www.a2jauthor.org/content/migrate-pm2-iis. To make pm2 independent of logouts follow the instructions here to install `pm2-windows-service`.

##### Notes to Windows users if pm2-windows-service fails. Run the below (from https://github.com/jon-hall/pm2-windows-service/issues/56):

```
npm install -g npm-check-updates
cd %USERPROFILE%\AppData\Roaming\npm\node_modules\pm2-windows-service
ncu inquirer -u
npm install
```

then
`pm2-service-install -n PM2`

7.) Download the latest DAT from repo through git or from https://github.com/CCALI/A2JDAT/releases into your webroot or preferred directory on your web server.

8.) Compile from source instructions

navigate to the downloaded location in a terminal and run *either* the following commands in sequence

```
cd a2jdat
npm run deploy
```

*or the equivalent*

```
cd a2jdat
npm install
npm run build
npm run build:server
```

if you encounter an error in this step it can often be resolved by deleting the `node_modules` folder in the `a2jdat` folder and repeating the step. If that does not work, re-clone into a brand new directory and run the commands in that directory.

9.) Configure DAT
Since the A2J software can run on many platforms, there is a small amount of platform specific configuration that is necessary. Navigate to  `a2jdat\samples.configs\`. There are two samples for config.json (config.json.nix.sample and config.json.win.sample) that will need to be edited and saved to the containing folder of the a2jdat as `config.json`. Edit and save the sample appropriate to your platform (config.json.nix.sample for \*NIX systems and config.json.win.sample for Windows systems).

The Most important keys are:
`GUIDES_DIR`-  required to establish location of templates
`GUIDES_URL`- relative web location of guides
`WKHTMLTOPDF_PATH`- path to binary of WKHTMLTOPDF
VIEWER_PATH- path to viewer
WKHTMLTOPDF_DPI- desired default dpi to render pdfs. CALI reccomends minimum of 300
`WKHTMLTOPDF_ZOOM`- The correction factor used to render text pdfs. This is necessary to standardize rendering across all platforms. On most \*nix systems this should be 1.6711 and on most windows systems this should be 1.5709.

All other keys must be present but the value is irrelevant.

Ensure that the value for the key WKHTMLTOPDF_PATH matches the path noted above where WKHTMLTOPDF is installed. Backslashes are special characters in json so each backslash must be typed twice to escape them and work properly.

a sample config.json for Windows is below:
```
{
  "GUIDES_DIR": "C:\\inetpub\\wwwroot\\a2j-viewer\\guides",
  "GUIDES_URL": "../a2j-viewer/guides",
  "VIEWER_PATH": "C:\\inetpub\\wwwroot\\a2j-viewer\\viewer\\",
  "WKHTMLTOPDF_PATH": "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf",
  "WKHTMLTOPDF_DPI": 300,
  "WKHTMLTOPDF_ZOOM": 1.5709
}
```

a sample config.json for Linux is below:
```
{
  "GUIDES_DIR": "/var/www/mysite.tld/a2j-viewer/guides",
  "GUIDES_URL": "../a2j-viewer/guides",
  "VIEWER_PATH": "/vol/data/sites/viewer.mysite.tld/a2jviewer/viewer",
  "WKHTMLTOPDF_PATH": "/usr/bin/local/wkhtmltopdf",
  "WKHTMLTOPDF_DPI": 300,
  "WKHTMLTOPDF_ZOOM": 1.6711
}
```

10.) Configure the server

The DAT is a simple restful interface with endpoints located at <host>/api/. Requests must be routed through the node /bin/www target. We will setup a reverse proxy to accomplish this.

##### Reverse proxy for windows (IIS)
for IIS Advanced Request Routing will need to be setup. Follow the instructions here:
https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/reverse-proxy-with-url-rewrite-v2-and-application-request-routing#configuring-rules-for-the-reverse-proxy

for IIS/Windows below is an example web.config
```
<?xml version="1.0" encoding="UTF-8"?>
<!--
     This is an exampe configuration file for using the DAT with pm2
-->
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyInboundRule1" stopProcessing="true">
                    <match url="(api/.*)" />
                    <action type="Rewrite" url="http://localhost:3000/{R:1}" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```
IIS will need to be restarted before these changes take effect

##### Reverse proxy for Apache (Linux)
for apache add the following directives to your site config

```
ProxyPass /api http://localhost:3000/api
ProxyPassReverse /api http://localhost:3000/api
ProxyBadHeader Ignore
```

##### Reverse proxy for nginx (Linux)
for nginx add the following directives
```
Location /api {
    Proxy_pass http://127.0.0.1:3000/
}
```

11.) Edit ecosystem.config.js

we have created a script to allow pm2 to manage memory and multiple instances of the DAT. The default script will run a cluster of 4 processes and restart a process if it uses more than 768MB.

12.)  Start the node process
navigate to the DAT folder in a terminal

`pm2 start ecosystem.config.js`

##  Configure auto-restart of pm2
To configure pm2 to autoload on startup run the following command with the desired pm2 processes running
`pm2 save`

13.) Testing and calibration
To ensure that the documents produced are identical to a2jauthor, run and generate a pdf through the `DAT calibration` guide provided in `/calibration` folder. With the PDF viewed at actual size and captured in screenshot The letter height of the Arial text should be 42pixels. A canonical png and pdf is included in the `/calibration` folder for comparison.

## Security Note
This software uses a version of jquery with a known security vulnerability. The features required to exploit this vulnerability are not used in this software and hence it is not an issue.

## More info

To find out more about A2J Viewer and A2J Author® please see our website, [www.a2jauthor.org](https://www.a2jauthor.org/)

Ever growing backend documentation including tutorials and examples can be found at [https://www.a2jauthor.org/content/a2j-selfhosting-and-backend](https://www.a2jauthor.org/content/a2j-selfhosting-and-backend)

For questions, contact Tobias Nteireho at tobias@cali.org

# A2JDAT

##### This repo is part of the A2J Author Project which consists of four repos...
##### 1. A2JViewer - https://github.com/CCALI/a2jviewer
##### 2. A2J Author - https://github.com/CCALI/a2jauthor
##### 3. A2J Document Automation Tool - https://github.com/CCALI/a2jdat
##### 4. A2J Dependencies - https://github.com/CCALI/a2jdeps

This repo hosts the distributable production version of the A2J Document Assembly Tool (DAT). The document assembly tool is an optional piece of software used for producing pdf documents at the end of interviews. It requires the A2Jviewer, wkhtmltopdf and nodejs 12+ to run properly. The recommended additional tools for windows are volta and pm2-windows-service and volta for *nix. 

Within this repo and releases you'll find a `.zip` file containing the minified JavaScript source for the DAT and sample configuration files

NOTE: By downloading this application, you are agreeing to the terms included in the user license [LICENSE.md](https://github.com/CCALI/a2jdat/blob/develop/LICENSE.md).

## Hosting
The DAT requires nodejs 20.17.0+. *NIX Systems supporting nodejs 20.17.0+ is supported. Windows is no longer supported. It has been tested on ubuntu 18,20, and 24; centos;

While other server environments may work, they have not been tested. Should you get another hosting environment working, please do a Pull Request at the hosted [A2J DAT](https://github.com/CCALI/a2jdat) repo to let us know any steps taken so that we may share with others.

### Current release
if installing through git, the current release version is always in the `production` branch. This is identical to the zipped source package in the releases page.

## Upgrade notes/summary from node A2JDAT v2

**The folder structure has changed.** It is recommended that your current setup is backed up. This means at a minimum, config.json and ecosystem.config.js. Alternatively you may checkout/unzip this repo into a new folder.

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

**The WKHTMLTOPDF_ZOOM settings have changed. YOU MUST SET THIS CORRECTLY TO MATCH PDFs GENERATED ON A2JAUTHOR.ORG** On most \*nix systems this should be 1.6711 and on most windows systems this should be 1.5709.

Assuming you have all up-to-date dependencies (wkhtmltopdf, node, npm, pm2, volta) you can run
`npm run deploy`
and skip to step 13 of installation instructions for calibration. Otherwise you must start from step 0.

## General Installation instructions

#### All Platforms + common solutions to common problems
For all platforms this document should work as written. You can skip to `step 4` of `Installation Instructions` for systems with working DAT setup. Starting from `step 1` may upgrade those DAT subdependencies which is expected to cause no issues.

This document should work as written but some components will likely need to be recompiled for the current node 16.

if the DAT does not properly start after using these instructions, the likely culprit is `muhammara`. This will be indicated by running `pm2 logs` and seeing a node version error. To confirm this, run `pm2 logs` which will yield something like 
```
2|dev-hydr | was compiled against a different Node.js version using
2|dev-hydr | NODE_MODULE_VERSION 72. This version of Node.js requires
2|dev-hydr | NODE_MODULE_VERSION 93. Please try re-compiling or re-installing
2|dev-hydr | the module (for instance, using `npm rebuild` or `npm install`).
2|dev-hydr |     at Object.Module._extensions..node (node:internal/modules/cjs/loader:1183:18)
2|dev-hydr |     at Module.load (node:internal/modules/cjs/loader:981:32)
2|dev-hydr |     at Function.Module._load (node:internal/modules/cjs/loader:822:12)
2|dev-hydr |     at Module.require (node:internal/modules/cjs/loader:1005:19)
2|dev-hydr |     at Module.Hook._require.Module.require (/home/a2jprod/.volta/tools/image/packages/pm2/lib/node_modules/pm2/node_modules/require-in-the-middle/index.js:80:39)
2|dev-hydr |     at require (node:internal/modules/cjs/helpers:102:18)
2|dev-hydr |     at Object.<anonymous> (/vol/data/sites/hydra.a2jauthor.org/a2jdat/node_modules/re2/re2.js:3:13)
2|dev-hydr |     at Module._compile (node:internal/modules/cjs/loader:1101:14)
2|dev-hydr |     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1153:10)
2|dev-hydr |     at Module.load (node:internal/modules/cjs/loader:981:32)
```

To rectify
follow the instructions below:

1.) go to the `a2jdat` folder

2.) run `npm install muhammara` in a command line

3.) restart DAT process and test

if that doesn't work try below:

1.) `cd node_modules/muhammara`

2.) `node_modules/\@mapbox/node-pre-gyp/bin/node-pre-gyp rebuild`

3.) restart DAT process and test


## Installation instructions


0.)  **NVM is no longer supported and should be uninstalled and replced with voltajs**. For \*nix users uninstall nvm if installed
```
rm -rf #NVM_HOME
```


1.) Install voltajs (https://github.com/volta-cli/volta).
The DAT is a simple restful API that requires nodejs to serve endpoints. Though, you are free to install the node version that the DAT targets and manage it manually, the recommended method is to use a node version manager which will allow the simultaneous installation of multiple versions of node and mitigates several administration issues.

Obtain volta here: https://docs.volta.sh/guide/getting-started

For \*nix, per the instructions above run : `curl https://get.volta.sh | bash`

#### For all users


2.) Install node through volta
navigate to the root folder of the DAT (contains `a2jdat` folder) and type the following commands in the terminal to install the required node version

```
volta install node@20.17.0
```

check that the install was successful by typing

`node -v`

which should produce the version number of node we installed, `20.17.0`

navigate to the a2jdat subdiectory and check the node version in volta Which should automatically download the right version as it is pinned in `package.json`
by running
```
volta list
```
 

check that the install was successful by typing

`node -v`

which should produce the version number of node we installed, `20.17.0`


3.) Install global DAT dependencies and subdependencies:

Git is a source control manager and required for npm. This can be obtained through most \*nix package managers. For windows, install Git by downloading latest from
https://git-scm.com/download/


4.) Install build tools:

The node sub-dependencies for the DAT must be built locally on the target system and requires build tools for languages other than node. Run the command below to install the necessary build tools:

#### For all platforms run the command below

```npm install @mapbox/node-pre-gyp node-gyp babel-cli steal-tools@1 -g```


5.) Install wkhtmltopdf
WKHTMLTOPDF is the engine used to transform interview data into PDF from an intermediate HTML file. Download the latest stable version from https://wkhtmltopdf.org/downloads.html and install it in the environment. *Make a note of the install path*.

6.) Install node process manager
The node process manager handles automatic restarts, memory mangement, monitoring, and error logging.

For All platforms:
The recommended process manager is pm2 (http://pm2.keymetrics.io/). Install it with the following command

`npm install pm2 -g`


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

if you encounter `EINTEGRITY` errors delete `package-lock.json` and rerun `npm run deploy`

9.) Configure DAT
Since the A2J software can run on many platforms, there is a small amount of platform specific configuration that is necessary. Navigate to `a2jdat\samples.configs\`. There are two samples for config.json (config.json.nix.sample and config.json.win.sample) that will need to be edited and saved to the containing folder of the a2jdat as `config.json`. Edit and save the sample appropriate to your platform (config.json.nix.sample for \*NIX systems and config.json.win.sample for Windows systems).

The Most important keys are:
`GUIDES_DIR`- required to establish location of templates
`GUIDES_URL`- relative web location of guides
`WKHTMLTOPDF_PATH`- path to binary of WKHTMLTOPDF
`VIEWER_PATH`- path to folder containing guides folder. For most standalone installs this will be the path to the extracted viewer which should enclose a `guides` folder. For A2JAuthor installations this will be the folder containing `userfiles`
WKHTMLTOPDF_DPI- desired default dpi to render pdfs. CALI recommends minimum of 300
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

12.) Start the node process
navigate to the DAT folder in a terminal

`pm2 start ecosystem.config.js`

## Configure auto-restart of pm2
To configure pm2 to autoload on startup run the following command with the desired pm2 processes running
`pm2 save`

## Calibrate
13.) Testing and calibration
To ensure that the documents produced are identical to a2jauthor, run and generate a pdf through the `DAT calibration` guide provided in `/calibration` folder. With the PDF viewed at actual size and captured in screenshot The letter height of the Arial text should be 68pixels. A canonical png and pdf is included in the `/calibration` folder for comparison.

## Security Note
This software uses software with dependencies with a few known security vulnerabilities. The features required to exploit this vulnerability are not used in this software in normal production and hence it is not an issue.

## More info

To find out more about A2J Viewer and A2J Author® please see our website, [www.a2jauthor.org](https://www.a2jauthor.org/)

Ever growing backend documentation including tutorials and examples can be found at [https://www.a2jauthor.org/content/a2j-selfhosting-and-backend](https://www.a2jauthor.org/content/a2j-selfhosting-and-backend)

For questions, contact Tobias Nteireho at tobias@cali.org

## License
[GNU AGPLv3](./LICENSE.md)

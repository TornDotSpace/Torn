<img src="https://torn.space/img/harrlogo.png">

<h3 align="center">A somewhat popular online space MMO.</h3>
<br>
<p align="center">
    <img src="https://img.shields.io/github/contributors/TornDotSpace/Torn?style=for-the-badge&color=ff1f44">
    <img src="https://img.shields.io/github/last-commit/TornDotSpace/Torn?style=for-the-badge&color=ff1f44">
    <img src="https://img.shields.io/github/languages/code-size/TornDotSpace/Torn?style=for-the-badge&color=ff1f44">
</p>

## Prerequisites
* Node.JS v14+
* NPM v7
* MongoDB
* Python 3.x (`pip install -r requirements.txt`)

## Local Development Setup
* Navigate to the directory you wish to put the repository in.
* Clone the repo.
```sh
git clone https://github.com/TornDotSpace/Torn
```
* Install Node.JS from [here](https://nodejs.org).
* Update NPM to v7
```sh
npm i -g npm
```
* Run the shell script to start the server!
```sh
./start_dev_server.sh # UNIX
./devServer-win.sh # Windows
```
* Navigate to `http://localhost:7301` in your browser, and you should be able to play.
## rank23aka24 branch setup IMPORTANT NOTES
* This branch has a newer version of start_dev_server.sh for newer mongodb > 6.1 since one of the parameters got deprecated and removed.
* This branch is focused on making a dev-style serviceable server. Particularly it attempts to use https over IPv6, config/torn.cfg had to be modified because of certificate and CORS issues - while now they do not need torn.cfg backups if you want to test any of the http-only versions (every other .sh except start_giba_win_devmix_server_mdb_6.1-HTTPS.sh, start_unix_devmix_server_mdb_6.1-HTTPS.sh, production_build.sh and test_build.sh), that backup is still stored.
* If you want to make your dev server visible through your local net, you will need to at least add the host parameter on the deploy/webpack.*.js that you are calling through the sh scripts (NOT on webpack.common.js)
* For https you may need to generate keys that cover the domain (ideally) and IP (test-only), with openssl for example (possible example below) - albeit the best optin is to get those legally certified by an official Certificate Authority!
```sh
openssl genrsa -out PEM/localhost.key 2048
#cat > localhost.cnf << 'EOF'
#[req]
#default_bits = 2048
#prompt = no
#distinguished_name = dn
#req_extensions = v3_req
#
#[dn]
#CN = 2001:db8::10
#
#[v3_req]
#subjectAltName = IP:2001:db8::10, DNS:ipv6server.example.com
#EOF
#openssl req -new -key PEM/localhost.key -out PEM/petitionlocalhost.csr -config PEM/localhost.cnf
openssl req -new -key PEM/localhost.key -out PEM/petitionlocalhost.csr
openssl req -new -x509 -extensions v3_ca -keyout PEM/localhostCAprivateKey.pem -out PEM/localhostCA.pem -days 3650
openssl x509 -req -in PEM/petitionlocalhost.csr -CA PEM/localhostCA.pem -CAkey PEM/localhostCAprivateKey.pem -days 3650 -set_serial 2026033101 -out PEM/localhost.crt

#openssl x509 -req -in PEM/petitionlocalhost.csr -CA PEM/localhostCA.pem -CAkey PEM/localhostCAprivateKey.pem -days 3650 -set_serial 2026040102 -out PEM/localhost.crt  -extensions v3_req -extfile PEM/localhost.cnf
```
* You can run the shell script 
``
start_unix_devmix_server_mdb_6.1-HTTPS.sh # UNIX
start_giba_win_devmix_server_mdb_6.1-HTTPS.sh # Windows + git bash*
``
* *_devmix_server_mdb_6.1* are the ones which properly update the out-game global leaderboard.
* Due to the lead developer of this branch's limitations on their computer space, all the .sh with "win_" on them have many of their commands preceded by "winpty", focused on being run from windows' git bash towards Windows (providing a virtual environment venv for python, that you may need to enable manually).
* There's a file "Help For Python VirtualEnvironment On WinPowerShell.txt" for helping setting some python environment stuff on windows.
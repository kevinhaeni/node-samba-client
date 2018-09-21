node-samba-client
=================

Node.js wrapper for smbclient


Requirements
------------
Smbclient must be installed. This can be installed on OSX with Homebrew [using this script](https://raw.githubusercontent.com/Homebrew/homebrew-core/1fd22fea2426e1ae34e85177234c6e59f63add58/Formula/samba.rb) and on Ubuntu with `sudo apt install smbclient`.

API
-------------

	var SambaClient = require('samba-client');

	var client = new SambaClient({
	  address: '//server/folder', // mandatory
	  username: 'test', // not mandatory (defaults to guest)
	  password: 'test', // not mandatory
	  domain: 'WORKGROUP' // not mandatory
	  path: 'pathToFolder' // not mandatory
	  others: ... // not mandatory
	});

	// send a file
	client.sendFile('somePath/file', 'destinationFolder/name', function(err) {});

	// get a file
	client.getFile('someRemotePath/file', 'destinationFolder/name', function(err) {})

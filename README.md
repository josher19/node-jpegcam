node-jpegcam
============

Allows you to upload pictures taken from your webcam.

Summary
-------
Port of the excellent jpegcam to node.

* Replaced test.php with a node lib/server.js to serve static files and upload jpegs.
* Could not use `formidable` because the upload type is image/jpeg rather than a normal multipart form submit.
* Want to minify amount of external dependencies (node librarires) required.
* Should work all the way back to node 0.2.26!

Requirements
------------

* NodeJS for Server
* Web Browser
* Flash
* Webcam

Resources
---------
* Original PHP scripts and ActionScript code: http://code.google.com/p/jpegcam/
* Example port to ASP.NET: http://forums.asp.net/t/next/1687495

Testing
-------
Node Versions:

* v0.2.26
* v0.5.7-pre
* v0.6.2

TODO
----
* Update to Version 1.0.9 of jpegcam webcam.swf
* Nicer examples
* Document /roll
* getFileList('jpg')
* Make a jQuery Mobile version
* Way to change Port (default: 8887)

License
-------
* [MIT](http://www.opensource.org/licenses/mit-license.php) (LICENSE.md)

->> Josh W <<-

2011-09-30

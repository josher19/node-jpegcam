#!/usr/bin/env node 
/*
replacement for test.php 

$filename = date('YmdHis') . '.jpg';
$result = file_put_contents( $filename, file_get_contents('php://input') );
if (!$result) {
	print "ERROR: Failed to write data to $filename, check permissions\n";
	exit();
}

$url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/' . $filename;
print "$url\n";
 
MIT License: http://www.opensource.org/licenses/mit-license.php

*/

// process.on('uncaughtException', function (err) {console.warn(err)});

var http = require('http'),
    fs = require('fs'),
    sys = require('util'), // require('sys'),
    path = require('path'),
    url = require('url');

/** Time in format: YYYYmmddhhmmss in UTC/GMT timezone */
function getDateTime(d) {
    return (d||new Date()).toISOString().replace(/[\-T:A-Z ]/ig, "").split(".")[0]
}

var mimes = {
     ".txt"  : "text/plain"
    ,".htm"  : "text/html"
    ,".html" : "text/html"
    ,".js"   : "text/javascript"
    ,".json" : "text/javascript"
    ,".png"  : "image/png"
    ,".gif"  : "image/gif"
    ,".jpg"  : "image/jpg"
    ,".jpeg" : "image/jpg"
    ,".php"  : "text/html"
    ,".swf"  : "application/x-shockwave-flash"
    ,".mp3"  : "audio/mp3"
}

function getMimeType(filename) {
    var ext=path.extname(filename); /* filename.split(".").pop(); */
    return mimes[ext] || "text/" + (ext.substring(1) || "html");
}

function getEncoding(mimetype) {
    return mimetype && mimetype.indexOf("text") !== 0 ? "binary" : "utf8" ;
}

var here = path.join( process.cwd(), "htdocs" );

var queue = typeof exports == "undefined" ? {} : exports
queue.req = null
queue.res = null
queue.target = "waiting for connection ...";
queue.cwd = here

function uploadFile(request, response, target) {
    queue.req = request;
    queue.res = response;
    queue.target = target;
    
    var postData = "";
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    
    var mimetype = request.headers['content-type'];
    var encoding = getEncoding(mimetype);
    request.setEncoding(encoding);
    console.info("Mimetype:", mimetype, "Encoding:", encoding);

    /* request.setEncoding("utf8"); */
    
        
    function errorHandler(err) {
	  var msg = ["ERROR: Failed to write data to ", target,", check permissions. ", err, "\n"].join("");
      
      response.writeHead(500, {'content-type': 'text/plain'});
      response.write(msg);
      response.end();
      
      console.warn(msg);      
    }
    request.addListener("error", errorHandler);

    request.addListener("data", function(postDataChunk) {
      postData += postDataChunk;
      //console.log(sys.inspect(arguments));
      console.log("Received POST data chunk '"+
        postDataChunk.length + "'.", "args", arguments.length);
    });

    request.addListener("end", function() {
      /* route(pathname, response, postData); */
      console.log(sys.inspect(arguments));
      console.log("end " +  postData.length)
      
      var host = request.headers.host;
      var there = path.join(here, target);
      
      fs.writeFile(there, postData, encoding, function(err) { 
          console.log("Wrote file", there, "length:", postData.length, "encoding: ", encoding);
          console.log(arguments);
          if (null != err) errorHandler(err);
      });
      
      response.writeHead(200, {'content-type': 'text/html'});
      response.write("http://" + host + "/" + target + "\n");
      response.end();

    });

}

function getRoll(y) { 
    if (null == y) y = '20'; /* images from the 21st century */
    return fs.readdirSync(here).filter(function(item) { return ~item.indexOf(".jpg") && !item.indexOf(y)}) /* Files like: YYYYMMDD*.jpg */
}

function getFileList(regex) {
	if (null == regex) regex = ".html";
	return fs.readdirSync(here).filter(function (file) { return String(file).match(regex); }).map(function (item) { return String(item).link(item); })
}

/* show a static file */
function show(req, response, filename) {
  console.log("Request handler 'show' was called. " + filename);
  var mimetype = getMimeType(filename);
  var encoding = getEncoding(mimetype);
  fs.readFile(filename || "/tmp/test.jpeg", encoding, function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {"Content-Type": mimetype});
      response.write(file, encoding);
      response.end();
    }
  });
}

http.createServer(function onServerRequest(req, res) {
  var pathname = url.parse(req.url).pathname;
  if (0==pathname.indexOf("/roll")) {
	  var mimetype = req.headers['content-type'] || 'text/javascript';
	  var yearMonthDay = path.basename(pathname);
	  if (yearMonthDay == "roll") yearMonthDay = '';
	  
      res.writeHead(200, {"Content-Type": mimetype});
      var diff = function(a,b) { return parseInt(a, 10) - parseInt(b, 10);} 
      res.write("roll="+JSON.stringify(getRoll(yearMonthDay).sort(diff)), 'utf8');
      res.end();
      
	  return
  }
  if (pathname == '/test.php' || pathname == '/upload.js') {
      var target = getDateTime() + '.jpg'
      uploadFile(req,res, target);
      return;
  }
  var there = path.join(here, pathname);
  if (pathname.indexOf(".jpg") > 0 || path.existsSync(there) && pathname.length > 1 ) { 
	  show(req,res,there); return; 
  }
  /* else */
  var files = getFileList();
  var html = '<h1>Files:</h1> <li>' + files.join('<li>');
  

  res.writeHead(200, {'content-type': 'text/html'});
  res.write(html);
  res.end();
  
}).listen(8887);

/* older stuff */

function oldStuff() {

function postPage(req,res) {
  if (pathname == '/upload' && req.method.toLowerCase() == 'post') {
    console.log('Uploading file ' + pathname );
    /* parse a file upload */
    var form = new formidable.IncomingForm();
    form.uploadDir = here;
    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/html'});
      var target = getDateTime(files.upload.lastModifiedDate) + '.jpg';
      /*
      res.write('Creating ' + target.link(target) + '<br /><br />');
      res.write('Received upload:<br /><br />\n\n<pre>');
      res.end(sys.inspect({fields: fields, files: files}) + "</pre>");      
      */
      fs.rename(files.upload.path, target, console.log);
      /* fs.symlink */
      res.write(target + "\n");
      res.end();
    });
    return;
  }
  var there = path.join(here, pathname);
  if (pathname.indexOf(".jpg") > 0 || path.existsSync(there) && pathname.length > 1 ) { show(req,res,there); return; }
  /* show a file upload form */
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="upload" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>');
}

function tryto(fn,a,b,c) { try { puts(null,fn(a,b,c)) } catch(e) { puts(e) } }

function puts(err,msg) { process.stdout.write((err || msg)+"\n" + arguments.length +  "\n") }

function jstr() {var a=arguments; tryto(function() { return JSON.stringify(a) });}

var showit = jstr;
var queue = {}

var apiServer = http.createServer(function requestor(req, res) {
  showit(req);
  showit(res);
  switch (req.url) {
    case '/do_something':
      
      /*      everyone.now.doSomething(); */
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('<form action="/upload" method="post" enctype="multipart/form-data">'+
'<input type="file" name="upload-file">'+
'<input type="submit" value="Upload">'+
'</form>' +
'<form action="/upload" method="get" id="form2">'+
'<input type="file" name="upload-file">'+
'<input type="submit" value="Upload">'+
'</form>' );
      res.end();
    break;    
    
    case '/upload':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write('hi ' + req.statusCode);
      upload_file(req, res);
      res.end();
    break;
    
    default:
      if (req.url && req.url.match(/upload/)) {
         upload_file(req,res);
         res.writeHead(200, {'Content-Type': 'text/html'});
         res.write('hi ' + req.statusCode);         
      } else {
         res.writeHead(404, {'Content-Type': 'text/plain'});
         res.write('You r doing it rong!');
         res.end('No such service\n');
      }
    break;
  }
});
// apiServer.listen(8081, "127.0.0.1");



var server = http.createServer(function(req, res) {
  switch (req.uri.path) {
    case '/':
      display_form(req, res);
      break;
    case '/upload':
      upload_file(req, res);
      break;
    default:
      show_404(req, res);
      break;
  }
});
// server.listen(8000);

function display_form(req, res) {
  res.writeHeader(200, {'Content-Type': 'text/html'});
  res.write(
    '<form action="/upload" method="post" enctype="multipart/form-data">'+
    '<input type="file" name="upload-file">'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
  res.end();
}

function upload_file(req, res) {
  queue.res = res;
  queue.req = req;
      
  req.setEncoding('binary');

  var stream = req || new multipart.Stream(req);
  stream.addListener('part', function(part) {
    part.addListener('body', function(chunk) {
      var progress = (stream.bytesReceived / stream.bytesTotal * 100).toFixed(2);
      var mb = (stream.bytesTotal / 1024 / 1024).toFixed(1);

      sys.print("Uploading "+mb+"mb ("+progress+"%)\015");

      /* chunk could be appended to a file if the uploaded file needs to be saved */
    });
  });
  stream.addListener('complete', function() {
    res.writeHeader(200, {'Content-Type': 'text/plain'});
    res.write('Thanks for playing!');
    res.end();
    sys.puts("\n=> Done");
  });
}

function show_404(req, res) {
  res.writeHeader(404, {'Content-Type': 'text/plain'});
  res.write('You r doing it rong!');
  res.end();
}
}

//---------------------------------------------------------------------
//
//       DPD visualiser
//       created for the POETS project
//
//---------------------------------------------------------------------

// creates a node.js based server used to render the incoming particle movements from the simulation
var fs = require('fs');
var path = require('path');

var cdir = process.cwd();

// load in the config file
var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
console.log("Loaded in config file");
console.log("---------------------------------");
console.log("frames_location: "+config.frames);
console.log("state filename: "+config.state);
console.log("---------------------------------");

const wstream = fs.createWriteStream('./to_poets_devices.sock')

// copy over the node_modules directory
// https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
function copyFileSync( source, target ) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    //copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}
// actually copy the files
copyFolderRecursiveSync(__dirname+'/node_modules/', './');

// config loaded now load in the libraries
const express = require('express');
const app = express();
const WebSocket = require('ws');


// reading from STDIN: https://stackoverflow.com/questions/20086849/how-to-read-from-stdin-line-by-line-in-node
var readline = require('readline');
var r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// open our web socket
const wss = new WebSocket.Server({port: 8079});

// send a particle position update  to the rendered instance
function sendUpdate(wss, update_str) {
    // https://github.com/websockets/ws#simple-server
    wss.clients.forEach(function each(client) {
     if(client !== wss && client.readyState == WebSocket.OPEN) {
      client.send(update_str);
      //console.log(update_str);
     }
    });
}

wss.on('connection', function(ws) {
  ws.on('message', function incoming(data) {
    // write to a named pipe that will be picked up by the executive and passed to pts-serve
    wstream.write(data);
    // var pos = JSON.parse(data);
    // console.log(pos.mx);
    // console.log(pos.my);
  })
})

// updates the frames folder
function update_frames(f) {
    //copy state.json to config.frames directory
    copyFileSync(config.state, config.frames+'/state_'+f+'.json');
    app.get('/_frames/state_'+f+'.json', (req,res) => res.sendFile(path.join(cdir+'/'+config.frames+'/state_'+f+'.json')));
}

// create the _frames folder if it does not exist
if(!fs.existsSync(config.frames)){
  fs.mkdirSync(config.frames);
}

// for initial setup find out how many frames are there already and save it as metadata in _meta.json
// get the number of already completed frames from the frames folder and store it in an _meta.json file
var frame_cnt;
fs.readdir(config.frames, (err, files) => {
   frame_cnt = files.length;
   files.forEach( function(file) {
      //console.log("Adding get rule for ./frames/" + file);
      app.get('/_frames/'+file, (req,res) => res.sendFile(path.join(cdir+'/'+config.frames+'/'+file)));
   });

   // write the frame_cnt to the _meta.json file
   frame_cnt_json = "{ \"num_frames\":"+frame_cnt+"}"
   fs.writeFile("./_meta.json", frame_cnt_json, function (err) {
      if(err) {
         return console.log(err);
      }
      console.log("The _meta.json file was saved\n");
   });
   // provide a GET rule for the _meta.json file
   app.get('/meta.json', (req, res) => res.sendFile(path.join(cdir+'/_meta.json')));
});

// get stdin data which will be passed to the rendered graph
r1.on('line', function(line) {
  sendUpdate(wss, line);
  // update_frames(frame_cnt);
  frame_cnt = frame_cnt + 1;
});


app.get('/', (req, res) => res.sendFile(path.join(__dirname+'/src/index.html')));
app.get('/state.json', (req, res) => res.sendFile(path.join(cdir+'/'+config.state)));
app.get('/d3-3d.js', (req, res) => res.sendFile(path.join(__dirname+'/src/d3-3d.js')));

app.listen(3000, () => console.log('listening on port 3000'))

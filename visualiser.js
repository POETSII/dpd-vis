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

// Parameters for getting a real nice picture
var vol_side = 25;
var timesteps = [1, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 9998];
var timestep = 0;
var framesFolder = "/" + vol_side + "_frames";
var fileName = "state_" + timestep + ".json";
var filter_water = false;
var offset = 0;
var blackWhite = false;
var dimension = 'x';

// // load in the config file
// var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
// console.log("Loaded in config file");
// console.log("---------------------------------");
// console.log("frames_location: "+config.frames);
// console.log("state filename: "+config.state);
// console.log("---------------------------------");

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

function createFolder(target) {
    if ( !fs.existsSync( target ) ) {
        fs.mkdirSync( target );
    }
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
     }
    });
}

// // updates the frames folder
// function update_frames(f) {
//     //copy state.json to config.frames directory
//     copyFileSync(config.state, config.frames+'/state_'+f+'.json');
//     app.get('/_frames/state_'+f+'.json', (req,res) => res.sendFile(path.join(cdir+'/'+config.frames+'/state_'+f+'.json')));
// }

// // create the _frames folder if it does not exist
// if(!fs.existsSync(config.frames)){
//   fs.mkdirSync(config.frames);
// }

// for initial setup find out how many frames are there already and save it as metadata in _meta.json
// get the number of already completed frames from the frames folder and store it in an _meta.json file
fs.readdir(framesFolder, (err, files) => {
    app.get(framesFolder + "/" + fileName, (req,res) => res.sendFile(path.join(cdir + '/' + framesFolder + '/' + fileName)));
});


app.get('/', (req, res) => res.sendFile(path.join(__dirname+'/src/index.html')));
app.get('/state.json', (req, res) => res.sendFile(path.join(cdir+'/'+config.state)));
app.get('/d3-3d.js', (req, res) => res.sendFile(path.join(__dirname+'/src/d3-3d.js')));

app.listen(3000, () => console.log('listening on port 3000'))

var t = 0;

wss.on('connection', function() {
  wss.clients.forEach(function each(client) {
    if(client.readyState == WebSocket.OPEN) {
        timestep = timesteps[t];
        framesFolder = "/" + vol_side + "_frames";
        fileName = "state_" + timestep + ".json";

        fs.readdir(framesFolder, (err, files) => {
            app.get(framesFolder + "/" + fileName, (req,res) => res.sendFile(path.join(cdir + '/' + framesFolder + '/' + fileName)));
        });

        var d = '{\n'
        + '\t' + '"vol_side":     ' + vol_side + ',\n'
        + '\t' + '"timestep":     ' + timestep + ',\n'
        + '\t' + '"filter_water": ' + filter_water + ',\n'
        + "\t" + '"offset":       ' + offset + ',\n'
        + "\t" + '"blackWhite":   ' + blackWhite + ',\n'
        + "\t" + '"dimension":    "' + dimension + '"\n'
        + '}' + "\n";

        client.send(d);


  client.onmessage = function(event) {
    var html = event.data;
    var image = "";
    for (c = 0; c < html.length; c++) {
        if (html[c] == "<" && html[c + 1] == "/" && html[c + 2] == "s" && html[c + 3] == "v" && html[c + 4] == "g" && html[c + 5] == ">") {
            image += "</svg>";
            break;
        }
        image += html[c]
    }

    filepath = "blob-pics/";
    createFolder(filepath);
    if (blackWhite) {
        filepath += "greyscale/";
    } else {
        filepath += "colour/"
    }
    createFolder(filepath);
    filepath += "timestep_" + timestep + "/";
    createFolder(filepath);
    filepath += dimension + "/";
    createFolder(filepath);
    if (filter_water) {
        filepath += "no_water/";
    } else {
        filepath += "water/";
    }
    createFolder(filepath);
    filepath += offset + ".svg";

    fs.writeFile(filepath, image, function (err) {
      if (err) throw err;
    });

    // Increment
    if (!filter_water) {
        filter_water = true;
    } else if (!blackWhite) {
        filter_water = false;
        blackWhite = true;
    } else if (offset < (vol_side - 1)) {
        offset += 1.0;
        filter_water = false;
        blackWhite = false;
        console.log("Dimension = " + dimension);
        console.log("Timestep  = " + timestep);
        console.log("Offset    = " + offset);
        console.log();
    } else if (t < (timesteps.length - 1)) {
        t++;
        timestep = timesteps[t];
        offset = 0.0;
        filter_water = false;
        blackWhite = false;
        console.log("Dimension = " + dimension);
        console.log("Timestep  = " + timestep);
        console.log("Offset    = " + offset);
        console.log();
    } else if (dimension != 'z') {
        t = 0;
        timestep = timesteps[t];
        offset = 0.0;
        filter_water = false;
        blackWhite = false;
        if (dimension == 'x') {
            dimension = 'y';
        } else if (dimension == 'y') {
            dimension = 'z';
        }
        console.log("Dimension = " + dimension);
        console.log("Timestep  = " + timestep);
        console.log("Offset    = " + offset);
        console.log();
    } else {
        process.exit(0);
    }

    wss.clients.forEach(function each(client) {
    if(client.readyState == WebSocket.OPEN) {
        client.send("DONE");
    }
  });

  }
    }
  });
});

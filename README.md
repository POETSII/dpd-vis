# Dissipative Particle Dynamics (DPD) Visualiser 
#### 0.0.1

<p align="center">
    <img src="dpd_example.gif"/>
</p>

This is a DPD visualiser that uses a standard POETS JSON format for bead position and velocity. The aim is to build this repository into a standard interface for all POETS based DPD simulators. 
The current visualiser is a javascript web-based interface (see above) that uses d3.js to render the particle positions in a 3D space.

It currently has the following features:
* filtering of particle type
* real-time display of the current simulation
* speed up playback of the current simulation from the start
* speed up playback of a previously completed simulation

During playback the (toroidal) 3D space can be rotated, moved around, and dynamically filtered for inspection. 

## usage
Interfacing with the visualiser is done via a UNIX pipe and JSON files, for example:
```bash
./yoursim | nodejs dpdvis/visualiser.js
```
Where `yoursim` is a dpd simulator and `dpdvis/visualiser.js` is the visualiser from this repo.
Along the unix pipe a stdout message `"u"` indicates that a new JSON state file is ready to read to update the visualiser with new particle positions. This JSON file needs to conform to the format described below.  

### JSON format
This JSON file captures the state of the simulation at any given moment in time. To do this it needs to describe, the id, the position <x,y,z> of each particle, the velocity of each particle <vx,vy,vz>, and the type of each particle (for colouring). The current JSON format looks like the following:

```json
{
  "beads":[
        {"id":0, "x":10.0865, "y":4.74095, "z":9.41798, "vx":0.0219849, "vy":0.0437972, "vz":0.111897, "type":0},
        {"id":1, "x":9.59185, "y":10.9292, "z":2.36002, "vx":0.0577424, "vy":-0.0583262, "vz":-0.0547249, "type":1},
        {"id":2, "x":8.02985, "y":5.49861, "z":6.16524, "vx":-0.0968982, "vy":0.0434639, "vz":0.0509043, "type":2}
   ]
}

```

In the future we will probably want to add another JSON section that contains some more details about the simulation parameters, such as K_{B}T or the particle repulsion parameters, etc...  

### configuration
A `config.json` file needs to be specified to tell the visualiser the following:
* the name of JSON output from your simulation specifying the particle positions
* the location where frames of your state JSON files will be stored for playback

Typically this looks something like the following:

```json
{
    "frames" : "_frames",
    "state": "state.json"
}
```


### install requirements

The following must be installed in order to use the visualiser

```bash
apt-get install npm
apt-get install nodejs
```

#### TODO list

* Make the particle filtering easier (using radio buttons or something) so that you don't have to remember the numerical particle type
* Move the filer stuff and the playback stuff to the right hand side in a control panel
* test out opacity reduction instead of setting the fill to empty when filtering particles 


### changelog

* 0.0.1 - initial release

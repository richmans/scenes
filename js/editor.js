// hey javascript! how about you get your own copy method!
function copy(oldObj) {
    var newObj = {};
    for(var i in oldObj) {
        if(oldObj.hasOwnProperty(i)) {
            newObj[i] = oldObj[i];
        }
    }
    return newObj;
}

angular.module("showmaster", ["dndLists", "ngDialog"])
.value('DeviceTypes', {
  looper: {
    label: "Looper",
    icon: "refresh",
    inputs: ["ticks"],
    outputs: ["1", "2", "3", "4", "5", "6", "7", "8"]
  },
  dimmer: {
    label: "Dimmer",
    icon: "tachometer",
    inputs: ["input", "intensity"],
    outputs: ["output"]
  },
  
})

.factory("Scene", function(DeviceTypes) {
  var maxDevice = 0;
  
  var Device = function(type) {
    newDevice = copy(DeviceTypes[type])
    newDevice.height = Math.max(newDevice.inputs.length, newDevice.outputs.length) * 44 + 20;
    newDevice.id = maxDevice;
    maxDevice += 1;
    return newDevice;
  }
  
  var Level = function(id) {
    return {
      devices: [],
      id: id,
      addDevice: function(type) {
        this.devices.push(Device(type));
      },
      connections: [],
      getInputTop: function(deviceId, inputPort) {
        console.log("Getting input port top for " + deviceId + "," + inputPort);
        deviceOffset = 0;
        inputDevice = null;
        for(deviceIndex in this.devices) {
          device = this.devices[deviceIndex];
          if(device.id == deviceId) {
            inputDevice = device;
            break;
          }else {
            deviceOffset += device.height + 10;
          }
        }
        if (inputDevice == null) {
          console.log("Can't find input device " + deviceId + " in level " + this.id);
        }
        portIndex = inputDevice.inputs.indexOf(inputPort);
        return deviceOffset + portIndex * 44 + 32;
      },
      getOutputTop: function(deviceId, outputPort) {
        deviceOffset = 0;
        outputDevice = null;
        for(deviceIndex in this.devices) {
          device = this.devices[deviceIndex];
          if(device.id == deviceId) {
            outputDevice = device;
            break;
          }else {
            deviceOffset += device.height + 10;
          }
        }
        if (outputDevice == null) {
          console.log("Can't find output device " + deviceId + " in level " + this.id);
        }
        portIndex = outputDevice.outputs.indexOf(outputPort)
        if (portIndex == -1) {
          console.log("Can't find output port " + outputPort + " on device " + deviceId + " in level " + this.id);
        }
        return deviceOffset + portIndex * 44 + 32;
      }
    }
  }
  
  var Scene = {
    levels:[],
    maxLevel: 0,
    addLevel: function() {
      console.log("Adding level");
      this.levels.push(Level(this.maxLevel));
      this.maxLevel += 1;
    }
  };
  return Scene;
})

.controller("SceneController", function($scope, Scene, ngDialog) {
  $scope.scene = Scene
  this.addLevel = function() {
    Scene.addLevel();
  }
})

.controller("RawSceneController", function($scope, Scene) {
  this.scene = Scene;
  this.sceneJSON= function() {
    return JSON.stringify(this.scene,null, 2);
  }
})


.controller("LevelController", function($scope, Scene, ngDialog, DeviceTypes) {
  this.devices = [];
  this.level = {};
  $scope.models = {
    DeviceTypes: DeviceTypes
  };

  
  this.setLevel = function(level) {
    this.level = level;
    this.devices = level.devices
    $scope.$on("select-port", this.selectPort.bind(this));
    $scope.$parent.$parent.$on("connect-" + level.id, this.connect.bind(this));
    $scope.$parent.$parent.$on("open-" + level.id, this.openOutput.bind(this))
    $scope.$parent.$parent.$on("close-" + level.id, this.closePorts.bind(this))
   
    if (level.id > 0) {
      $scope.$parent.$parent.$on("open-" + (level.id - 1), this.openInput.bind(this))
      $scope.$parent.$parent.$on("close-" + (level.id - 1), this.closePorts.bind(this))
    }
  }
  
  this.addDevice = function() {
    dialog = ngDialog.open({template: "create_item.html", className: 'ngdialog-theme-default', scope: $scope})
    dialog.closePromise.then(function (data) {
      this.level.addDevice(data.value);
      $scope.$parent.$parent.$emit("draw");
    }.bind(this));
  }
  
  this.openInput = function() {
    console.log(this.level.id + " open input");
    this.portOpen = "input-open";
  }
  
  this.openOutput = function() {
    console.log(this.level.id + " open output");
    this.portOpen = "output-open";
  }
  
  this.closePorts = function() {
    console.log(this.level.id + " close");
    $scope.$emit("select-port")
    this.portOpen = "";
  }
  
  this.connectInput = function(device, port) {
    $scope.$parent.$parent.$emit("connect-" + (this.level.id -1), device.id, port);
  }
  
  this.selectPort = function(event, device, port) {
    this.selectedDevice = device;
    this.selectedPort = port;
  }
  
  this.connect = function(event, device_id, port) {
    this.level.connections.push({outputDevice: this.selectedDevice, outputPort: this.selectedPort, inputDevice:device_id, inputPort:port});
    $scope.$parent.$parent.$emit("draw");
    $scope.$emit("select-port");
  }
})

.controller("DeviceController", function($scope) {
  this.setDevice = function(device){
      $scope.$parent.$parent.$emit("draw");
      this.device = device;
      this.height = device.height;
  }
  this.height = function() {
    return {"height" : this.device.height + "px"};
  }
  
  console.log($scope.$element);
 // new WireIt.Terminal($scope.$element);
})

.controller("OutputPortController", function($scope) {
  this.selected = false;
  this.select = function() {
    $scope.$parent.$parent.$parent.$parent.$emit("select-port", $scope.device.id, $scope.port);
    this.selected = true;
  };
  
  this.deselect = function() {
    this.selected = false;
  }
  $scope.$parent.$parent.$parent.$parent.$on("select-port", this.deselect.bind(this))
})

.controller("BayController", function($scope, $element, Scene) {
  this.isOpen = false;
  this.isClosed = true;
  this.Scene = Scene;
  this.canvas = $element.find("canvas")[0];
  this.setId = function(bayId) { 
    this.bayId = bayId; 
  }
  
  this.openBay = function() {
    $scope.$parent.$parent.$emit("close-all");
    $scope.$parent.$parent.$emit("open-" + this.bayId);
    this.isOpen = true;
    this.isClosed = false;
    this.draw();
  }
  this.closeBay = function() {
    if (this.isOpen == false) return;
    $scope.$parent.$parent.$emit("close-" + this.bayId);
    this.isOpen = false;
    this.isClosed= true
  }
  this.toggleBay = function() {
    if (this.isOpen) {
      this.closeBay();
    }else{
      this.openBay();
    }
  }
  
  this.draw = function() {
    this.canvas.height = parseInt($element.css("height"));
    this.outputLevel = this.Scene.levels[this.bayId];
    this.inputLevel = this.Scene.levels[this.bayId + 1];
    console.log("Drawing")
    console.log(this.outputLevel);
    for (index in this.outputLevel.connections) {
      console.log(index);
      connection = this.outputLevel.connections[index];
      console.log(connection);
      this.drawConnection(connection);
    }
  }
  
  this.drawConnection = function(connection) {
    console.log("Drawing connection " + connection);
    console.log(connection);
    inputHeight = this.inputLevel.getInputTop(connection.inputDevice, connection.inputPort)
    console.log("Input height" + inputHeight);
    outputHeight = this.outputLevel.getOutputTop(connection.outputDevice, connection.outputPort)
    console.log("Output height" + outputHeight);
    this.drawLine(inputHeight, outputHeight)
  }
  
  this.drawLine = function(inputHeight, outputHeight) {
    var ctx = this.canvas.getContext("2d");
    maxWidth = this.canvas.width;
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.moveTo(0,outputHeight);
    ctx.lineTo(maxWidth, inputHeight);
    ctx.strokeStyle = '#18F';
    ctx.stroke();
  }
  
  $scope.$parent.$parent.$on("close-all", this.closeBay.bind(this))
  $scope.$parent.$parent.$on("draw", this.draw.bind(this))
})
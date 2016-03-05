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

.controller("SceneController", function($scope, ngDialog) {
  $scope.models = {
    levels: []
  };
  $scope.models.levels.push({label: "level1"})
  this.add_level = function() {
    $scope.models.levels.push({}); 
  }
})


.controller("LevelController", function($scope, ngDialog, DeviceTypes) {
  $scope.models = {
    devices: [],
    DeviceTypes: DeviceTypes
  };
  
  this.setId = function(levelId) {
    this.levelId = levelId;
    $scope.$parent.$parent.$on("open-" + this.levelId, this.openOutput.bind(this))
    $scope.$parent.$parent.$on("close-" + this.levelId, this.closePorts.bind(this))
   
    if (levelId > 0) {
      $scope.$parent.$parent.$on("open-" + (this.levelId - 1), this.openInput.bind(this))
      $scope.$parent.$parent.$on("close-" + (this.levelId - 1), this.closePorts.bind(this))
    }
  }
  
  this.add_device = function() {
    dialog = ngDialog.open({template: "create_item.html", className: 'ngdialog-theme-default', scope: $scope})
    dialog.closePromise.then(function (data) {
      $scope.models.devices.push(copy(DeviceTypes[data.value]));
    });
  }
  
  this.openInput = function() {
    console.log(this.levelId + " open input");
    this.portOpen = "input-open";
  }
  
  this.openOutput = function() {
    console.log(this.levelId + " open output");
    this.portOpen = "output-open";
  }
  
  this.closePorts = function() {
    console.log(this.levelId + " close");
    this.portOpen = "";
  }
})

.controller("DeviceController", function($scope) {
  this.setDevice = function(device){
      this.device = device;
  }
  this.height = function() {
    return Math.max(this.device.inputs.length, this.device.outputs.length) * 44 + 20;
  }
})

.controller("BayController", function($scope) {
  this.isOpen = false;
  this.setId = function(bayId) { this.bayId = bayId; }
  
  
  this.openBay = function() {
    $scope.$parent.$parent.$emit("close-all");
    $scope.$parent.$parent.$emit("open-" + this.bayId);
    this.isOpen = true;
  }
  this.closeBay = function() {
    if (this.isOpen == false) return;
    $scope.$parent.$parent.$emit("close-" + this.bayId);
    this.isOpen = false;
  }
  this.toggleBay = function() {
    if (this.isOpen) {
      this.closeBay();
    }else{
      this.openBay();
    }
  }
  
  $scope.$parent.$parent.$on("close-all", this.closeBay.bind(this))
  
})
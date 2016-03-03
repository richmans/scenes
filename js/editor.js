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
    outputs: ["1", "2", "3"]
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
  
  this.setId = function(id) {this.id = id}
  
  this.add_device = function() {
    dialog = ngDialog.open({template: "create_item.html", className: 'ngdialog-theme-default', scope: $scope})
    dialog.closePromise.then(function (data) {
      $scope.models.devices.push(copy(DeviceTypes[data.value]));
    });
  }
})

.controller("DeviceController", function($scope) {
  this.setDevice = function(device){
      this.device = device;
  }
  this.height = function() {
    return Math.max(this.device.inputs.length, this.device.outputs.length) * 45;
  }
})

.controller("BayController", function($scope) {
  this.setId = function(id) { this.id = id; }
  this.openBay = function() {
    alert("HELLO " + this.id);
  }
})
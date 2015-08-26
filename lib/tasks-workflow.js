
var _ = require('lodash')

var TasksWorkflow = function (){
  var self = this
  if (!(self instanceof TasksWorkflow)) return new TasksWorkflow()
  this.tasks = [];
}

var targetIndex = 0
TasksWorkflow.createTask = function(task, target, options, config){
  var name = task;
  target = target || '_' + (targetIndex++) + 'target';
  return {
    name: name,
    target: target,
    options: options,
    config: config,
    fqtt: function (){
      return name + (target?':'+target:'')
    }
  }
}
TasksWorkflow.createTaskAlias = function(name, tasks, options, config){
  return {
    name: name,
    tasks: tasks,
    options: options,
    config: config,
    fqtt: function (){
      return this.name + (this.target?':'+this.target:'')
    },
    getTargetsName: function(){
      var names = []
      this.tasks.forEach(function(t){names.push(t.fqtt())})
      return names
    },
    getTasksName: function(){
      var names = []
      this.tasks.forEach(function(t){names.push(t.name)})
      return names
    }
  }
}

TasksWorkflow.mergeArrays = function(a, b) {
  if (_.isArray(a)) {
    for(var yy in b) {
      if ((yy+'').match(/[0-9]+/)) {
        if (a.indexOf(b[yy]) === -1) {
          a.push(b[yy]);
        }
      }else {
        a[yy] = b[yy];
      }
    }
    return [].concat(a)
  }
}
TasksWorkflow.merge = function(a, b, customizer, k){
  _.merge(a, b, customizer, k);
}

TasksWorkflow.prototype.getTasksName = function (withTasks) {
  var names = []
  this.tasks.forEach(function(t){
    (!withTasks || t.tasks.length>0) && names.push(t.name)
  })
  return names
}
TasksWorkflow.prototype.getTargetsName = function (withTasks) {
  var names = []
  this.tasks.forEach(function(t){
    (!withTasks || t.tasks.length>0) && names.push(t.fqtt())
  })
  return names
}

TasksWorkflow.prototype.forEach = function (cb) {
  [].concat(this.tasks).forEach(cb)
  return this;
}
TasksWorkflow.prototype.indexOfTask = function (name) {
  var index = -1
  this.tasks.forEach(function(task, i){
    if (index===-1 && task.name===name) {
      index = i
    }
  })
  return index;
}
TasksWorkflow.prototype.insertBeforeTask = function (name, newTask) {
  var index = this.indexOfTask(name)
  if (index>-1) this.tasks.splice(index, 0, newTask);
  return this;
}
TasksWorkflow.prototype.insertAfterTask = function (name, newTask) {
  var index = this.indexOfTask(name)
  if (index>-1) this.tasks.splice(index+1, 0, newTask);
  return this;
}
TasksWorkflow.prototype.insertBeforeTarget = function (name, target, newTarget) {
  this.tasks.forEach(function(task){
    var index = -1;
    (task.tasks||[]).forEach(function(t, i){
      if (index === -1 && t.fqtt()===name+':'+target) {
        index = i
      }
    })
    if (index>-1) task.tasks.splice(index, 0, newTarget);
  })
  return this;
}
TasksWorkflow.prototype.insertAfterTarget = function (name, target, newTarget) {
  this.tasks.forEach(function(task){
    var index = -1;
    (task.tasks||[]).forEach(function(t, i){
      if (index === -1 && t.fqtt()===name+':'+target) {
        index = i
      }
    })
    if (index>-1) task.tasks.splice(index+1, 0, newTarget);
  })
  return this;
}
TasksWorkflow.prototype.removeTask = function (name) {
  var index = this.indexOfTask(name);
  if (index>-1) this.tasks.splice(index, 1);
  return this;
}
TasksWorkflow.prototype.removeTarget = function (name, target) {
  this.tasks.forEach(function(task){
    var index = -1;
    (task.tasks||[]).forEach(function(t, i){
      if (index === -1 && t.fqtt()===name+':'+target) {
        index = i
      }
    })
    if (index>-1) task.tasks.splice(index, 1);
  })
  return this;
}
TasksWorkflow.prototype.replaceTask = function (name, newTask) {
  var index = this.indexOfTask(name)
  if (index>-1) this.tasks.splice(index, 1, newTask);
  return this;
}
TasksWorkflow.prototype.replaceTarget = function (name, target, newTask) {
  this.tasks.forEach(function(task){
    (task.tasks||[]).forEach(function(t, i){
      if (t.fqtt()===name+':'+target) {
        task.tasks[i] = newTask
      }
    })
  })
  return this;
}

TasksWorkflow.prototype.skipTask = function (name, onlyIf) {
  if (onlyIf) {
    var i = -1
    this.tasks.forEach(function(task){
      if (task.name===name) {
        task.tasks = []
      }
    })
    if (i>-1) {
      var task = this.tasks.splice(i, 1)
    }
  }
  return this;
}
TasksWorkflow.prototype.skipLastTask = function (onlyIf) {
  if (onlyIf) {
    this.tasks.pop()
  }
  return this;
}
TasksWorkflow.prototype.skipAll = function (onlyIf) {
  if (onlyIf) {
    this.tasks = []
  }
  return this;
}
TasksWorkflow.prototype.appendTask = function (task) {
  if (task){
    if (!_.isArray(task)) task = [task]
    var that = this
    task.forEach(function(t){
      if (!t.fqtt) {
        t = TasksWorkflow.createTask(t.name, t.target, t.options, t.config)
      }
      if (!t.options) t.options = {}
      if (!t.config) t.config = {}
      that.tasks.push(t)
    })
  }
  return this;
}

TasksWorkflow.prototype.packToTask = function (name, description) {
  if (this.getTasksName().indexOf(name)>-1)
    throw new Error('You can\'t shadow tasks. Task \'' + name + '\' already exists !')
  var tasks = [].concat(this.tasks)
  var g = {
    run: {descriptions: {}}
  }
  g.run.descriptions[name] = description || 'description not provided.';
  this.tasks = [TasksWorkflow.createTaskAlias(name, tasks, {}, g)]
  return this;
}
TasksWorkflow.prototype.appendTo = function (workflow) {
  this.tasks.forEach(function(task){
    workflow.appendTask(task)
  })
  return this;
}

TasksWorkflow.prototype.configureGrunt = function (grunt) {
  var remerge = function(a, b) {
    if (_.isArray(a)) {
      for(var yy in b) {
        if ((yy+'').match(/[0-9]+/)) {
          if (a.indexOf(b[yy]) === -1) {
            a.push(b[yy]);
          }
        }else {
          a[yy] = b[yy];
        }
      }
      return [].concat(a)
    }
  }

  this.tasks.forEach(function(task){
    (task.tasks || []).forEach(function(t){
      var options = {};
      options[t.name] = {};
      if (t.target && t.options && !t.options[t.name]) {
        options[t.name] = {};
        options[t.name][t.target] = t.options;

      } else {
        options[t.name] = t.options
      }
      TasksWorkflow.merge(grunt.config.data, options, TasksWorkflow.mergeArrays);
      TasksWorkflow.merge(grunt.config.data, t.config, TasksWorkflow.mergeArrays);
    })
    var options = {};
    options[task.name] = {};
    if (task.target && task.options && !task.options[task.name]) {
      options[task.name][task.target] = task.options;
    } else {
      options[task.name] = task.options
    }
    TasksWorkflow.merge(grunt.config.data, options, TasksWorkflow.mergeArrays);
    TasksWorkflow.merge(grunt.config.data, task.config, TasksWorkflow.mergeArrays);
  })
  return this;
};

TasksWorkflow.prototype.registerTo = function (grunt, mainTask) {
  this.configureGrunt(grunt)
  this.tasks.forEach(function(task){
    var taskNames = task.getTargetsName()
    if (taskNames.length) {
      grunt.registerTask(task.name, taskNames)
    }
  })
  grunt.registerTask(mainTask, this.getTargetsName(true))
  return this;
};

module.exports = TasksWorkflow;

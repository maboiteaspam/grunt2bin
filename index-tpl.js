
module.exports = {
  compat: 'x.x.x',
  // -
  config: function(grunt, cwd){
    grunt.config.merge({
      'some': {
        'data': 'to merge'
      }
    })
  },
  // -
  run: function(main, grunt, cwd){
    /*
     TasksWorkflow()
     .appendTask( TasksWorkflow.createTask('some target of '))
     .appendTask( TasksWorkflow.createTask('loaded tasks'))
     .packToTask('as a new task unit',
     'with a description'
     ).appendTo(main);
     */
  }
};

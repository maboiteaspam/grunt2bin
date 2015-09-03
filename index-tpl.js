
module.exports = {
  compat: 'x.x.x',
  // -
  config: function(grunt, cwd){
    /*
    you may want to load your user configuration
    before
     grunt.loadSystemUserGruntfile('config')
     */
    grunt.config.merge({
      'task': {
        'options': {
          'set': 'the defaults that way'
        }
      }
    })
    /*
     or after
     grunt.loadSystemUserGruntfile('config')
     */

    /*
     or not at all.
     */
  },
  // -
  run: function(main, grunt, cwd, TasksWorkflow){
    /*
     you may want to load your user workflow changes
     before
     grunt.loadSystemUserGruntfile('run')
     */

    TasksWorkflow()
      //.appendTask( TasksWorkflow.createTask('some target of '))
      //.appendTask( TasksWorkflow.createTask('loaded tasks'))
      .packToTask('as a new task unit',
      'with a description'
    ).appendTo(main);

    /*
     or after
     grunt.loadSystemUserGruntfile('run')
     */

    /*
     or not at all.
     */
  }
};

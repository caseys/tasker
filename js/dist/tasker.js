/** @jsx React.DOM */

var tasker = function() {

	//view to represent each task
	var TaskView = this.TaskView = React.createClass({displayName: 'TaskView',
		getInitialState: function () {
			return {
				text: this.props.task.text,
				editing: (this.props.task.text === ''),
				trashed: this.props.task.trashed || false
			};
		},

		componentDidMount: function() {
			var task = this;
			setTimeout(function() {			
				task.setFocus();
			}, 20);
		},

		setFocus: function() {
			var node = this.refs.taskInput.getDOMNode();
			node.focus();
			node.setSelectionRange(0, node.value.length);
		},

		goEditState: function() {
			this.setState({
				editing: true
			}, this.setFocus);
		},

		goReadState: function() {
			if (!this.state.text || this.state.text !== this.props.task.text) {
				this.props.editTask(this.props.task, {
					text: this.state.text
				});
			}

			this.setState({
				editing: false
			});
		},

		setChecked: function(event) {
			var checked = event.target.checked;
			this.setState({
				'checked': checked
			});			
			this.props.editTask(this.props.task ,{
				'checked': checked
			});			
		},

		setTrashed: function(event) {
			var trashedToggle = !this.state.trashed;
			this.setState({
				'trashed': trashedToggle
			});
			this.props.editTask(this.props.task ,{
				'trashed': trashedToggle
			});	
			this.goReadState();			
		},

		handleKeyDown: function (event) {
			if (event.which === 27 /* escape */) {
				this.setState({text: this.props.task.text});
				this.goReadState();
			} else if (event.which === 13 /* enter */) {
				this.goReadState();
			} 
		},

		handleChange: function (event) {
			this.setState({text: event.target.value});
		},
		
		handleBlur: function(event) {
			if (this.state.editing) {
				this.goReadState();
			}
		},

		render: function () {
			var task = this.props.task;

			var cx = React.addons.classSet;
			var classes = cx({
				'task': true,
				'edit': this.state.editing,
				'active': !this.props.task.checked,
				'trashed': this.state.trashed
			});			

			return (
				React.DOM.div({className: classes, onDoubleClick: this.goEditState}, 
					React.DOM.input({type: "checkbox", ref: "taskCheck", className: "taskCheck", 
						checked: this.props.task.checked, 
						onChange: this.setChecked}
					), 
					React.DOM.span({className: "taskText"}, task.text), 
					React.DOM.input({type: "text", ref: "taskInput", className: "taskInput", autofocus: "true", placeholder: "enter task text", 
						value: this.state.text, 
						onBlur: this.handleBlur, 
						onChange: this.handleChange, 
						onKeyDown: this.handleKeyDown}
					), 
					React.DOM.input({type: "button", ref: "taskTrash", className: "taskTrash", 
						onClick: this.setTrashed}
					)
				)
			);
		}
	});

	//view containing task list and related interface
	var TaskerView = this.TaskerView = React.createClass({displayName: 'TaskerView',
		getInitialState: function() {
			return {
				filter: 'all'
			};
		},

		setAllFilter: function() {
			this.setState({
				filter: 'all'
			});		
		},

		setActiveFilter: function() {
			this.setState({
				filter: 'active'
			});		
		},

		setTrashedFilter: function() {
			this.setState({
				filter: 'trashed'
			});
		},

		emptyTrash: function() {
			this.props.taskData.removeTrashed();
			this.setState({
				filter: 'all'
			});		
		},

		shareTasks: function() {
			var url = window.location.href + "#" + this.props.taskData.shareHash();
			prompt("Share this URL", url);
		},

		handleNewTask: function() {
			this.props.taskData.addTask('');
		},

		handleEditTask: function(task, taskMixin) {
			this.props.taskData.editTask(task, taskMixin);
		},

		render: function() {
			var taskList = this.props.taskData.tasks.map(function (task) {
				return (
					TaskView({key: task.id, task: task, editTask: this.handleEditTask})
				);
			}, this);

			var numTrashed = this.props.taskData.getNumTrashed();
			var numActive = this.props.taskData.getNumActive();
			var numAll = this.props.taskData.tasks.length - numTrashed;

			var shareLink, trashFilterLink = null; //for jshint
			if (numTrashed) {
				trashFilterLink = React.DOM.span({className: "filterButton trash", onClick: this.setTrashedFilter}, "trash (", numTrashed, ")");
			}
			if (numAll) {
				shareLink = React.DOM.span({className: "shareLink", onClick: this.shareTasks}, "share");
			} else {
				if (this.state.filter !== 'trashed') {
					console.log('adding the foo', this.state.filter);
					this.props.taskData.addTask('', false);		
				}		
			}

			var cx = React.addons.classSet;
			var classes = cx({
				"taskerApp": true,
				'filterAll': this.state.filter === 'all',
				'filterActive': this.state.filter === 'active',
				'filterTrashed': this.state.filter === 'trashed'
			});

			return(
				React.DOM.div({className: classes}, 
					React.DOM.div({className: "header"}, 
						React.DOM.button({className: "taskAdd", 
							onClick: this.handleNewTask
						}, "+"), 
						React.DOM.button({className: "emptyTrash", 
							onClick: this.emptyTrash
						}, "empty trash"), 
						React.DOM.span(null, "tasks")
					), 
					React.DOM.div({className: "taskList"}, 
						taskList
					), 
					React.DOM.div({className: "taskFilter"}, 
						shareLink, 
						React.DOM.label(null, "showing: "), 
						React.DOM.span({className: "filterButton all", onClick: this.setAllFilter}, "all (", numAll, ")"), 
						React.DOM.span({className: "filterButton active", onClick: this.setActiveFilter}, "active (", numActive, ")"), 
						trashFilterLink
					)
				)
			);
		}
	});
};

tasker.prototype.data = {};
tasker.prototype.setData = function(newData) {
	this.data = newData;
};

tasker.prototype.render = function() {
	var TaskerView = this.TaskerView;
	React.renderComponent(
		TaskerView({taskData: this.data}), document.body
	);
};
;//a model to represent tasks
var taskModel = function(props, taskerRef) {
	this.id = props.id;
	this.text = props.text;
	this.checked = props.checked || false;
	this.trashed = props.trashed || false;
};


//utility classs for dealing with task data
var taskerData = function() {
	this.listeners = {};
	this.storageNamespace = 'tasker';

	var store = JSON.parse(localStorage.getItem(this.storageNamespace) || false); 

	//read URL for shared data
	var URIStore;
	try {
		URIStore = JSON.parse(
			decodeURIComponent(String(window.location.hash).replace('#','')) || false
		);
		window.location.hash = '';
	} catch(e) {
		URIStore = false;
	}

	//merge shared tasks into local tasks if needed
	if (URIStore && store && confirm('Shared tasks will be merged into the existing task last.')) {
		var existingKeyMap = {};
		for (var i = 0; i < store.length; i++) {
			existingKeyMap[store[i].key] = i;
		}
		console.log(existingKeyMap);
		for (i = 0; i < URIStore.length; i++) {
			var existing = existingKeyMap[URIStore[i].key];
			if (typeof existing != 'undefined') {
				store[existing] = URIStore[i];
			} else {
				store.push(URIStore[i]);
			}
		}
	} else if (URIStore && !store) {
		store = URIStore;
	}

	this.tasks = store || [];
};

taskerData.prototype.addTask = function(taskText, render) {
	var task = new taskModel({
		id: this.getUid(),
		text: taskText,
		checked: false
	}, this);
	this.tasks.unshift(task);
	this.saveTasks(render);
};

taskerData.prototype.removeTask = function(task) {
	this.tasks.splice(this.tasks.indexOf(task), 1);
};

taskerData.prototype.removeTrashed = function(broadcast) {
	this.tasks = this.tasks.filter(function(task) {
		if (task.trashed === true) {
			return false;
		}
		return true;
	});
	this.saveTasks(broadcast);
};

taskerData.prototype.addListener = function(callback) {
	this.listeners[callback] = callback;
};

taskerData.prototype.broadcastChanges = function() {
	for (var listenerCallback in this.listeners) {
		this.listeners[listenerCallback]();
	}
};

taskerData.prototype.shareHash = function() {
	var tasksDataString = JSON.stringify(this.tasks);	
	return encodeURIComponent(tasksDataString);
};

taskerData.prototype.saveTasks = function(broadcast) {
	var tasksDataString = JSON.stringify(this.tasks);
	localStorage.setItem(this.storageNamespace, tasksDataString);
	if (broadcast !== false) {
		this.broadcastChanges();
	}
};

taskerData.prototype.editTask = function(task, taskMixIn) {
	for (var propName in taskMixIn) {
		task[propName] = taskMixIn[propName];
	}
	if (task.text.trim() === '') {
		this.removeTask(task);
	}
	this.saveTasks();
};

taskerData.prototype.filterTasks = function(filter, condition) {
	if (typeof condition == 'undefined') condition = true;
	return this.tasks.filter(function(task) {
		if (task[filter] == condition) {
			return true;
		}
	});
};

taskerData.prototype.getNumTrashed = function() {
	return this.filterTasks('trashed').length;
};

taskerData.prototype.getNumActive = function() {
	var notTrashed = this.filterTasks('trashed', false);
	var notChecked = notTrashed.filter(function(task) {
		return task.checked !== true;
	});
	return notChecked.length;
};

taskerData.prototype.getUid = function() {
	return 'xyxy-xxxx-yyyy'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0;
		var v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

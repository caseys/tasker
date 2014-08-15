//a model to represent tasks
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
			decodeURIComponent(String(window.location.hash).replace(/^#+/,'')) || false
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

	this.tasks = store || [
		{
			id: 1,
			text: 'Climb Mount Fuji',
			checked: false,
			trashed: false
		},
		{
			id: 2,
			text: 'Reschedule beer committee meeting',
			checked: false,
			trashed: false
		},
		{
			id: 3,
			text: 'Get almond milk on the way home',
			checked: true,
			trashed: false
		},
		{
			id: 4,
			text: 'Create a task list app',
			checked: true,
			trashed: true
		}
	];
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

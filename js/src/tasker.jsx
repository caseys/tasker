/** @jsx React.DOM */

var tasker = function() {

	var doubleTouchStartTimestamp = 0;
	var hasTouch = 'ontouchstart' in document.documentElement;

	//view to represent each task
	var TaskView = this.TaskView = React.createClass({
		getInitialState: function () {
			return {
				text: this.props.task.text,
				editing: (this.props.task.text === ''),
				trashed: this.props.task.trashed || false
			};
		},

		componentDidMount: function() {
			if (this.state.editing === true) {
				var task = this;
				setTimeout(function() {			
					task.setFocus();
				}, 50);
			}
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
				var node = this.refs.taskInput.getDOMNode();
				node.blur();
			} 
		},

		handleChange: function (event) {
			this.setState({text: event.target.value});
		},
		
		handleBlur: function(event) {
			this.goReadState();
		},

		handleTouch: function(event) {
			var now = +(new Date());
			if (doubleTouchStartTimestamp + 500 > now) {
				event.preventDefault();
				this.goEditState();
			}
			doubleTouchStartTimestamp = now;
		},

		handleCheckTouch: function(event) {
			event.preventDefault();
			var node = this.refs.taskCheck.getDOMNode();
			node.checked = !node.checked;
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

			var deleteButtonClass; //for jslint
			if (hasTouch) {
				deleteButtonClass = "taskTrash taskTrashTouch";
			} else {
				deleteButtonClass = "taskTrash";				
			}

			return (
				<div className={classes} onTouchStart={this.handleTouch} onDoubleClick={this.goEditState}>
					<input type="checkbox" ref="taskCheck" className="taskCheck"
						checked={this.props.task.checked}
						onChange={this.setChecked}
						onTouchStart={this.handleCheckTouch}						
					/>
					<span className="taskText">{task.text}</span>
					<input type="text" ref="taskInput" className="taskInput" autofocus="true" placeholder="enter task text"
						value={this.state.text}
						onBlur={this.handleBlur}
						onChange={this.handleChange}
						onKeyDown={this.handleKeyDown}
					/>
					<input type="button" ref="taskTrash" className={deleteButtonClass}
						onClick={this.setTrashed}
					/>		
				</div>
			);
		}
	});

	//view containing task list and related interface
	var TaskerView = this.TaskerView = React.createClass({
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

		handleNewTask: function(event) {
			this.props.taskData.addTask('');
		},

		handleEditTask: function(task, taskMixin) {
			this.props.taskData.editTask(task, taskMixin);
		},

		render: function() {
			React.initializeTouchEvents(true);

			var taskList = this.props.taskData.tasks.map(function (task) {
				return (
					<TaskView key={task.id} task={task} editTask={this.handleEditTask}/>
				);
			}, this);

			var numTrashed = this.props.taskData.getNumTrashed();
			var numActive = this.props.taskData.getNumActive();
			var numAll = this.props.taskData.tasks.length - numTrashed;

			var shareLink, trashFilterLink = null; //for jshint
			if (numTrashed) {
				trashFilterLink = <span className="filterButton trash" onClick={this.setTrashedFilter}>trash ({numTrashed})</span>;
			}
			if (numAll) {
				shareLink = <span className="shareLink" onClick={this.shareTasks}>share</span>;
			} else if (this.state.filter !== 'trashed') {
				this.props.taskData.addTask('', false);		
			}

			var cx = React.addons.classSet;
			var classes = cx({
				"taskerApp": true,
				'filterAll': this.state.filter === 'all',
				'filterActive': this.state.filter === 'active',
				'filterTrashed': this.state.filter === 'trashed'
			});

			return(
				<div className={classes}>
					<div className="header">
						<button className="taskAdd"
							onClick={this.handleNewTask}
						>+</button>
						<button className="emptyTrash"
							onClick={this.emptyTrash}
						>empty trash</button>
						<span>tasks</span>
					</div>
					<div className="taskList">
						{taskList}
					</div>
					<div className="taskFilter">
						{shareLink}
						<label>showing: </label>
						<span className="filterButton all" onClick={this.setAllFilter}>all ({numAll})</span>
						<span className="filterButton active" onClick={this.setActiveFilter}>active ({numActive})</span>
						{trashFilterLink}
					</div>
				</div>
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
		<TaskerView taskData={this.data}/>, document.body
	);
};

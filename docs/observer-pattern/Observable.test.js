import Observable from "./Observable.js";

const myName = new Observable('Toby');
// accessing the getter
console.log(`Test "Toby" is successful: ${myName.value === 'Toby'}`);


const listOfFolders = [{ id: 1, name: 'Inbox' }, { id: 2, name: 'Spam' }, { id: 3, name: 'Trash' }];
const selectedFolder = new Observable('');

const showInConsole = (newValue, oldValue) => {
	console.log(`debug: Switched from ${listOfFolders[oldValue]?.name} to ${listOfFolders[newValue]?.name}`);
	console.log(`Test showInConsole newValue returns "Spam" is successful: ${listOfFolders[newValue]?.name === 'Spam'}`);
}

const updateEmailListPane = (newValue, oldValue) => {
	// more complex, this simply takes the new id, gets the folder
	const currentFolder = listOfFolders[newValue];
	// and likely runs some DOM updating for us based on that.
	console.log(`debug: Updating email list pane from "${oldValue}" to "${newValue}"`, currentFolder);
	console.log(`Test updateEmailListPane returns "Spam" is successful: ${currentFolder.name === 'Spam'}`);
}

selectedFolder.subscribe(showInConsole);
selectedFolder.subscribe(updateEmailListPane);


// a click on a folder updates the observable
selectedFolder.update(1);


const myTodo = new Observable({
	title: 'Make breakfast',
	description: 'No idea what',
	priority: 'normal',
	dueDate: Date.now()
})
myTodo.subscribe((val, oldVal) => {
	console.log('debug: ', val)
	console.log(`Test "myTodo" change description to "Make a toast" from "No idea what" is successful: ${val.description === 'Make a toast' && oldVal.description === 'No idea what'}`);
})
myTodo.update((oldVal) => ({
	...oldVal,
	description: 'Make a toast',
}))

import Observable from 'seui/observable'

export class Users extends Observable {
	constructor() {
		super([
			new User(1, 'Alice', 23),
			new User(2, 'Bob', 25),
			new User(123, 'Charlie', 27),
		])
	}

	getUser(userId) {
		return this.value.find((user) => user.id == userId)
	}

	getAll() {
		return this.value
	}
}

export class User {
	constructor(id, name, age) {
		this.id = id
		this.name = name
		this.age = age
	}
}

export const users = new Users()

export default users

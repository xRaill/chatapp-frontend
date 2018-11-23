import _ from 'lodash';

export class router {

	constructor() {
		console.log('Router Loaded')
		this.events();
	}

	events() {
		$('#app').on('click', '[data-route]', (e) => {
			chatapp.getClass($(e.target).data('route'));
		});

		chatapp.socket.on('router', (route) => this.goTo(route));
	}

	goTo(route) {

		if(typeof(chatapp[route]) != 'undefined' && chatapp.page != route) chatapp[route].show();
		else chatapp.getClass(route);
	}
}

// $(window).ready(() => window.chatapp.router = new router);
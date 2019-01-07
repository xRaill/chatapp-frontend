import _ from 'lodash';
 
const $ = require('jquery')
const jQuery  = $;
window.$      = $;
window.jQuery = $;

require('materialize-loader');


require('./index.html');

class CHATAPP {

	constructor() {

		$(document).ready(() => {
			this.socket = require('socket.io-client')(window.location.host +':8080');

			this.page = 'script';
			this.getClass('router');

			this.socket.on('connected', () => this.connected());
		});
	}

	connected() {		
		console.log('connected');

		this.socket.emit('action', 'authenticate', {
			token: localStorage.getItem('authToken')
		}, (data) => {
			if(data.success) {
				this.userid   = data.userId;
				this.username = data.username;
				this.router.goTo('main');
			} else this.router.goTo('login');
		});
	}

	toast(color, icon, message) {
		let ele = $(`
			<div id="toast" class="container toastz transition-scaleFade">
			</div>
		`);

		if(!$('#toast').length) $('#app').append(ele);
		else ele = $('#toast');

		let card = $(`
			<div class="row">
				<div class="col s12 m5">
					<div class="card-panel valign-wrapper z-depth-5 `+ color +`">
						<div class="col s2 large material-icons">`+ icon +`</div> 
						<div class="col s8 m9">`+ message +`</div>
						<div class="col s2 m1 h-4 material-icons close pointer">close</div>
					</div>
					<div class="timer"><span class="blue"></span></div>
				</div>
			</div>
		`);

		card.one('click', () => card.addClass('scaleFadeOut').fadeOut(1000));

		ele.append(card);

		setTimeout(() => {
			$(card).addClass('scaleFadeOut');
			setTimeout(() => {
				$(card).remove();
				if(!ele.children().length) ele.remove();
			}, 1000);
		}, 5000);
	}

	getClass(name, callback) {
		let self = this;

		let test = require('./'+ name +'.js');
		
		self[name] = new test[name]
		// self[name] = new
		// .then(cls => {
		// 	console.log(cls)
		// 	if(typeof callback == "function") callback(self[name]);
		// });
	}

	action(type, args) {
		this.socket.emit('action', type, args);
	}
}

$(window).ready(() => window.chatapp = new CHATAPP);
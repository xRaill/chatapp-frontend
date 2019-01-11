let popup = new require('./popup.js').popup;

export class friendRequests {

	constructor() {
		this.popup = new popup('friendRequests');

		let spinner = $(`
			<div class="valign-wrapper h-4">
				<div class="preloader-wrapper big active center-block">
					<div class="spinner-layer spinner-blue-only">
						<div class="circle-clipper left">
							<div class="circle"></div>
						</div><div class="gap-patch">
							<div class="circle"></div>
						</div><div class="circle-clipper right">
							<div class="circle"></div>
						</div>
					</div>
				</div>
			</div>
		`);

		this.popup.update({
			title: 'Friend Requests',
			body: spinner
		});

		this.popup.show();

		this.load();
	}

	load() {
		chatapp.socket.emit('action', 'friends', {
			type: 'get-requests'
		}, (data) => {
			if(data.success) this.display(data.friends);
		});
	}

	display(friends) {

		if(!friends.length) this.popup.update('body', 'You have no friend requests');

		let results = $('<div/>');

		for (let i = 0; i < friends.length; i++) {

			let elem = $(`
				<div class="userbar grey lighten-2 z-depth-1">
					<div class="center-align">`+ friends[i].username +`</div>
					<div class="accept waves-effect waves-green center-align">
						<i class="material-icons">check</i>
						<span>Accept</span>
					</div>
					<div class="deny waves-effect waves-red center-align">
						<i class="material-icons">cancel</i>
						<span>Deny</span>
					</div>
				</div>
			`);

			$(elem).find('.accept').on('click', (e) => chatapp.socket.emit('action', 'friends', {
				type: 'accept',
				friendId: friends[i].id
			}, (data) => {
				if(data.success) {
					chatapp.toast('blue lighten-3', 'people', 'You are now friends with: ' + friends[i].username);
					chatapp.main.loadFriends();
					$(e.target).closest('.userbar').slideUp(() => {
						$(e.target).closest('.userbar').remove();
						if(!$('#'+ this.popup.id).find('.userbar').length) this.popup.destroy();
					});
				}
			}));

			$(elem).find('.deny').on('click', (e) => chatapp.socket.emit('action', 'friends', {
				type: 'deny',
				friendId: friends[i].id
			}, (data) => {
				if(data.success) {
					chatapp.main.loadFriends();
					$(e.target).closest('.userbar').slideUp(() => {
						$(e.target).closest('.userbar').remove();
						if(!$('#'+ this.popup.id).find('.userbar').length) this.popup.destroy();
					});
				}
			}));

			results.append(elem);
		}

		return this.popup.update('body', results);
	}

}
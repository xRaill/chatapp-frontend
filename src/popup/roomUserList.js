let popup = require('./popup.js').popup;

export class roomUserList {

	constructor(args = {}) {

		this.args = args;

		this.popup = new popup({
			id:    'roomUserList',
			title: 'User List'
		});

		$(this.popup.body).html($(`
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
		`));

		this.load();
	}

	load() {	
		chatapp.socket.emit('action', 'rooms', {
			type:  'users-get',
			roomId: this.args.roomId
		}, (data) => {
			if(data.success) this.display(data.users, data.owner);
		});
	}

	display(users, owner) {
		$(this.popup.body).html('');

		for (let i = 0; i < users.length; i++) {

			let userId = localStorage.getItem('userId');
			let removable = owner ? true : users[i].id == userId ? true : users[i].id == userId ? true : false ; 
			let text = users[i].id == userId ?  owner ? ['Destroy Room', 'destroy'] : ['Leave Room', 'leave'] : ['Remove', 'remove'];

			let elem = $(`
				<div class="userbar grey lighten-2 z-depth-1">
					<div class="center-align">`+ users[i].username +`</div>
					<div class="center-align">
						<span>`+ (users[i].owner ? 'Owner' : 'User') +`</span>
					</div>
					`+ (owner ? `
					<div class="promote waves-effect waves-yellow center-align `+ (users[i].id == userId ? 'disabled': '') +`">
						<i class="material-icons">arrow_upwards</i>
						<span> Promote </span>
					</div>
					` : '') +`
					<div class="`+ text[1] +` waves-effect waves-red center-align `+ (removable ? '' : 'disabled')  +`">
						<i class="material-icons">cancel</i>
						<span>`+ text[0] +`</span>
					</div>
				</div>
			`);

			$(elem).find('.destroy').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Destroy room',
				message: 'Are you sure you want to destroy this room?',
				callback: (result) => {
					if(result) chatapp.socket.emit('action', 'rooms', {
						type: 'remove',
						roomId: this.args.roomId
					}, (data) => {
						if(data) this.popup.destroy();
					});
				}
			}));

			$(elem).find('.remove').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Remove user',
				message: 'Are you sure you want te remove <b>'+ users[i].username +'</b> from this room?',
				callback: (result) => {
					if(result) chatapp.socket.emit('action', 'rooms', {
						type:  'users-remove',
						userId: users[i].id,
						roomId: this.args.roomId 
					}, (data) => {
						if(data) $(e.target).closest('.userbar').slideUp(() => $(e.target).closest('.userbar').remove());
					});
				}
			}));

			$(elem).find('.leave').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Leave room',
				message: 'Are you sure you want to leave this room?',
				callback: (result) => {
					if(result) chatapp.socket.emit('action', 'rooms', {
						type:  'users-leave',
						roomId: this.args.roomId
					}, (data) => {
						if(data) this.popup.destroy();
					})
				}
			}));

			$(elem).find('.promote').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Promote user',
				message: 'Are you sure you want to promote <b>'+ users[i].username +'</b> to room owner?<br>'+
					'<span style="font-size:85%;"><b>WARNING:</b> You will no longer be the room owner!</span>',
				callback: (result) => {
					if(result) chatapp.socket.emit('action', 'rooms', {
						type:  'users-promote',
						userId: users[i].id,
						roomId: this.args.roomId
					}, (data) => {
						if(data) this.load();
					});
				}
			}))

			if(users[i].id == userId) $(this.popup.body).prepend(elem);
			else $(this.popup.body).append(elem);
		}
	}

}
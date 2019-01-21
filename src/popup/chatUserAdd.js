let popup = require('./popup.js').popup;

export class chatUserAdd {

	constructor(args = {}) {
		this.popup = new popup({
			id:    'chatUserAdd',
			title: 'Add user'
		});

		this.args = args;

		$(this.popup.body).html($(`	
			<input id="`+ this.popup.id +`-search" class="green lighten-3 center" placeholder="Search for user..." type="text">
			<div id="`+ this.popup.id +`-results">
				<div class="progress">
					<div class="indeterminate"></div>
				</div>
			</div>
		`));

		this.loading = true;

		this.search('');

		$(this.popup.dom +'-search').on('keyup', (e) => this.search(e.target.value));
	}

	search(val) {
		if(!this.loading) $(this.popup.dom +'-results').html(`
			<div class="progress">
				<div class="indeterminate"></div>
			</div>
		`);

		this.loading = true;

		clearTimeout(this.timer);
		this.timer = setTimeout(() => chatapp.socket.emit('action', 'search', {
			type:  'friends',
			roomId: this.args.roomId,
			search: val
		}, (data) => {
			this.loading = false
			if(data.success) this.display(data.friends);
		}), 1000);
	}

	display(users) {

		for (let i = 0; i < users.length; i++) {
			let text;

			if(users[i].inGroup) text = ['Remove from room', 'remove', 'red'];
			else                 text = ['Add to room', 'add', 'green'];

			let elem = $(`
				<div class="userbar grey lighten-2 z-depth-1">
					<div class="center-align">`+ users[i].username +`</div>
					<div class="`+ text[1] +' '+ (text[2] ? 'waves-effect waves-'+ text[2] :'') +` center-align">
						<span>`+ text[0] +`</span>
					</div>
				</div>
			`);

			$(elem).find('.add').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Add user to room',
				message: 'Are you sure you want to add <b>'+ users.username +'</b> to this room?',
				callback: (result) => chatapp.socket.emit('action', 'rooms', {
					type:  'users-add',
					userId: users[i].id,
					roomId: this.args.roomId
				}, (data) => {
					if(data.success) {
						chatapp.toast('blue lighten-3', 'people', 'You added <b>'+ users[i].username +'</b> to this room');
						
						$(e.target).closest('.add').fadeOut(() => $(e.target).closest('.add')
							.removeClass('add').removeClass('waves-effect').addClass('waves-red')
							.addClass('remove').find('span').text('Remove from room')).fadeIn();
					}
				})
			}));

			$(elem).find('.remove').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Remove from room',
				message: 'Are you sure you want to remove <b>'+ users[i].username +'</b> from this room?',
				callback: (result) => {
					if(result) chatapp.socket.emit('action', 'rooms', {
						type: 'users-remove',
						userId: users[i].id,
						roomId: this.args.roomId
					}, (data) => {
						chatapp.toast('blue lighten-3', 'people', 'You removed <b>'+ users[i].username +'</b> from this room');

						$(e.target).closest('.remove').fadeOut(() => $(e.target).closest('.remove')
							.removeClass('remove').removeClass('waves-red').addClass('waves-green')
							.addClass('add').find('span').text('Add to room')).fadeIn();
					});
				}
			}));

			$(this.popup.dom +'-results').append(elem);
		}

		$(this.popup.dom +'-results .progress').slideUp();
	}

}
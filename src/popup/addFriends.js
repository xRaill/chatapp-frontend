let popup = new require('./popup.js').popup;

export class addFriends {

	constructor() {
		this.popup = new popup({
			id:    'addFriends',
			title: 'Add friends'
		});

		$(this.popup.body).html($(`	
			<input id="`+ this.popup.id +`-search" class="grey lighten-1 input-field center" placeholder="Search for users..." type="text">
			<div id="`+ this.popup.id +`-results"></div>
		`));

		this.loading = false;

		$(this.popup.dom +'-search').on('keyup', (e) => this.search(e.target.value));
	}

	search(val) {
		if(val.length < 3) return;

		if(!this.loading) $(this.popup.dom +'-results').html(`
			<div class="progress">
				<div class="indeterminate"></div>
			</div>
		`);

		this.loading = true;

		clearTimeout(this.timer);
		this.timer = setTimeout(() => chatapp.socket.emit({
			type: 'search.users',
			search: val
		}, (data) => {
			this.loading = false
			if(data.success) this.display(data.users);
		}), 1000);
	}

	display(users) {

		for (let i = 0; i < users.length; i++) {
			let text;

			if(users[i].self)         text = ['This is you!', '', ''];
			else if(users[i].request) text = ['Friend request send!', '', ''];
			else if(users[i].friends) text = ['Unfriend', 'remove', 'red'];
			else                      text = ['Add as friend', 'add', 'green'];

			let elem = $(`
				<div class="userbar grey lighten-2 z-depth-1">
					<div class="center-align">`+ users[i].username +`</div>
					<div class="`+ text[1] +' '+ (text[2] ? 'waves-effect waves-'+ text[2] :'') +` center-align">
						<span>`+ text[0] +`</span>
					</div>
				</div>
			`);

			$(elem).find('.add').on('click', (e) => chatapp.socket.emit({
				type: 'friends.request',
				friendId: users[i].id
			}, (data) => {
				if(data.success) {
					chatapp.toast('blue lighten-3', 'people', 'You requested to be friends with <b>'+ users[i].username +'</b>');
					
					$(e.target).closest('.add').fadeOut(() => $(e.target).closest('.add')
						.removeClass('add').removeClass('waves-effect')
						.find('span').text('Friend request send!')).fadeIn();
				}
			}));

			$(elem).find('.remove').on('click', (e) => chatapp.getPopup('confirm', {
				title:   'Unfriend',
				message: 'Are you sure you want to unfriend <b>'+ users[i].username +'</b>?',
				callback: (result) => {
					if(result) chatapp.socket.emit({
						type: 'friends.remove',
						friendId: users[i].id
					}, (data) => {
						chatapp.toast('blue lighten-3', 'people', 'You removed <b>'+ users[i].username +'</b> as your friend');

						$(e.target).closest('.remove').fadeOut(() => $(e.target).closest('.remove')
							.removeClass('remove').removeClass('waves-red').addClass('waves-green')
							.addClass('add').find('span').text('Add as friend')).fadeIn();
						
						chatapp.main.loadFriends();
					});
				}
			}));

			$(this.popup.dom +'-results').append(elem);
		}

		$(this.popup.dom +'-results .progress').slideUp();
	}

}
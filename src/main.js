import _ from 'lodash';

export class main {

	constructor() {

		this.app = $(`
			<div class="row h-4">
				<div id="main-menu" class="col s12 m3 no-padding z-depth-1">

					<div id="main-top" class="h-1 blue lighten-2 z-depth-1">
						<div id="logout" class="waves-effect right"><i class="material-icons">logout</i></div>
						<div id="main-user"> `+ localStorage.getItem('username') +` </div>
						<div id="main-nav" class="auto-margin moveLeft">
							<i id="main-chats" class="material-icons waves-effect center">chat</i>
							<i id="main-users" class="material-icons waves-effect center">people</i>
						</div>
					</div>

					<div id="rooms-progress" class="progress">
						<div class="indeterminate"></div>
					</div>

					<div id="menu-list">
						<div id="menu-rooms"></div>
						<div id="menu-friends"></div>
						<div id="menu-friends-add" 
							class="btn-floating btn-large green waves-effect waves-light scale-transition scale-out">
							<i class="large material-icons">add</i>
						</div>
					</div>
				</div>

				<div id="main-chat" class="col s12 m9 hide-on-small-only h-4"></div>
			</div>
		`);

		$('#app').fadeOut(() => {
			$('#app').html(this.app).fadeIn(() => {
				this.beforeEvents();
				this.afterEvents();
				chatapp.socket.emit('action', 'rooms', {
					type: 'get'
				}, (data) => this.roomsAdd(data.rooms));

				this.loadFriends();
			});
		});
	}

	show() {
		chatapp.page = 'main';
		$('#app').fadeOut(() => $('#app').html(this.app).fadeIn(() => this.afterEvents()));
	}

	beforeEvents() {
		$(window).on('resize', () => {
			if($(window).innerWidth() <= 600){
				if($('#main-chat-msg').length) {
					$('#main-chat').removeClass('hide-on-small-only');
					$('#main-menu').slideUp();
				} else {
					$('#main-chat').addClass('hide-on-small-only');
					$('#main-menu').slideDown();
				}
			} else $('#main-menu').slideDown();
		});

		chatapp.socket.on('rooms-add', (rooms) => this.roomsAdd(rooms));
		chatapp.socket.on('rooms-remove', (rooms) => this.roomsRemove(rooms));

		chatapp.socket.on('friends-request', (friend) => {
			chatapp.toast('blue lighten-3', 'people', friend.username + ' send you a friend request') ;
			this.loadFriends();
		});
		
		chatapp.socket.on('messages-add', (messages) => this.messageAdd(messages));
	}

	afterEvents() {
		$('#logout').on('click', () => chatapp.socket.emit('action', 'logout', {}, (data) => {
			if(data.success) {
				chatapp.router.goTo('login');
				localStorage.removeItem('authToken');
				localStorage.removeItem('userId');
				localStorage.removeItem('username');
				delete chatapp.main;
			}
		}));

		$('#main-menu').on('click', '#main-chats', (e) => {
			$(e.target).parent().removeClass('moveRight').addClass('moveLeft');
			$('#menu-friends-add').addClass('scale-out');
			$('#menu-list').animate({
				'margin-left': '0',  
			});
		}).on('click', '#main-users', (e) => {
			$(e.target).parent().removeClass('moveLeft').addClass('moveRight')
			$('#menu-friends-add').removeClass('scale-out');
			$('#menu-list').animate({
				'margin-left': '-' + $('#menu-list').width()/2,  
			});
		});

		$('#menu-rooms').on('click', '.room', (e) => this.loadChat($(e.target).data('id'), $(e.target).find('span').text()));

		$('#menu-friends-add').on('click', (e) => this.addFriendsPopup());

		$('#main-chat').on('click', '#chat-list', () => {
			$('#chat-list-users').html('<div id="chat-list-progress" class="progress"><div class="indeterminate"></div></div>');

			chatapp.socket.emit('action', 'rooms', {
				type: 'users-get',
				roomId: this.currentRoomId
			}, (data) => {
				if(data.success) this.roomsUsersAdd(data.users, data.owner);
			});

			this.openPopup($('#chat-list-wrapper'))
		});

		$('#menu-list').on('touchstart', (e) => {
			let width = $('#menu-list').width()*-1;
			let startMargin = Math.abs($('#menu-list').css('margin-left').slice(0,-2))*-1;
			let oldX = e.originalEvent.touches[0].clientX;
			let newX;

			$('#menu-list').removeClass('menuSlideLeft').removeClass('menuSlideRight').css('margin-left', startMargin);

			$(window).on('touchmove', (e) => {
				newX = e.originalEvent.touches[0].clientX - oldX;
				let newMargin = (newX + startMargin);

				let res;
				if(newMargin <= 0) if(newMargin >= width/2) res = (startMargin < 0 ? newMargin : newMargin - startMargin);
				else res = width/2;
				else res = 0;
				$('#menu-list').css('margin-left', res + 'px');
			});

			$(window).one('touchend', () => {
				$(window).off();
				let range = 100;

				if(newX === undefined) return;
				if(startMargin < width/4) {
					if(newX < range) {
						$('#main-nav').removeClass('moveLeft').addClass('moveRight');
						$('#menu-list').animate({
							'margin-left': '-' + $('#menu-list').width()/2,  
						});
					} else {
						$('#main-nav').removeClass('moveRight').addClass('moveLeft');
						$('#menu-list').animate({
							'margin-left': 0,  
						});
						$('#menu-friends-add').addClass('scale-out');
					}
				} else {
					if(newX < range*-1) {
						$('#main-nav').removeClass('moveLeft').addClass('moveRight');
						$('#menu-list').animate({
							'margin-left': '-' + $('#menu-list').width()/2,  
						});
						$('#menu-friends-add').removeClass('scale-out');
					} else {
						$('#main-nav').removeClass('moveRight').addClass('moveLeft');
						$('#menu-list').animate({
							'margin-left': 0,  
						});
					}
				}
			});
		});
	}

	roomsAdd(rooms) {
		$('#rooms-progress').slideUp();
		
		for (var i = 0; i < rooms.length; i++) {

			$('#room-'+ rooms[i].id).remove();

			let elem = $(`
				<div class="room waves-effect z-depth-1" id="room-`+ rooms[i].id +`" data-id="`+ rooms[i].id +`">
					<span>`+ rooms[i].name +`</span>
				</div>
			`);	

			$('#menu-rooms').append(elem);
		}
	}

	roomsRemove(rooms) {
		for (let i = 0; i < rooms.length; i++) $('#room-' + rooms[i].id).remove();
	}

	roomsUsersAdd(users, owner = false) {
		for (let i = 0; i < users.length; i++) {

			$('#user-'+ users[i].id).remove();

			let userId = localStorage.getItem('userId');
			let removable = owner ? true : users[i].id == userId ? true : false; 
			let prepend = users[i].id == userId;
			let text = users[i].id == userId ?  owner ? 'Destroy Room' : 'Leave Room' : 'Remove';

			let elem = $(`
				<div class="userbar z-depth-1" id="user-`+ users[i].id +`">
					<div class="center-align">`+ users[i].username +`</div>
					<div class="center-align">
						<span>`+ (users[i].owner ? 'Owner' : 'User') +`</span>
					</div>
					<div class="waves-effect waves-red center-align `+ (removable ? 'disabled' : '')  +`">
						<i class="material-icons">cancel</i>
						<span>`+ text +`</span>
					</div>
				</div>
			`);

			if(prepend) $('#chat-list-users').prepend(elem);
			else $('#chat-list-users').append(elem);

			$('#chat-list-progress').slideUp();
		}

	}

	loadFriends() {
		$('#menu-friends').html($(`
			<div class="progress menu-progress">
				<div class="indeterminate"></div>
			</div>
		`));

		chatapp.socket.emit('action', 'friends', {
			type: 'get'
		}, (data) => {

			if(data.success) {

				$('#menu-friends').append($(`
					<div id="friend-requests" class="teal waves-effect z-depth-1 center-align" style="display:none;">
						<span id="friend-request-len">`+ data.requests +`</span> 
						Friend request(s)
					</div>
				`));

				$('#friend-requests').on('click', () => chatapp.getPopup('friendRequests'));

				if(data.requests) $('#friend-requests').slideDown();

				for (let i = 0; i < data.friends.length; i++) $('#menu-friends').append($(`
					<div class="friend waves-effect z-depth-1" id="friend-`+ data.friends[i].id +`">
						<span>`+ data.friends[i].username +`</span>
					</div>
				`));

				$('#menu-friends .progress').slideUp();
			}
		});
	}

	messageAdd(messages) {
		if(!messages) return;
		let wrapper = $('#main-chat-msg');
		let lastMsg = wrapper.find('*:last');
		let raw = wrapper.get()[0];
		for (let i = 0; i < messages.length; i++) this.parseChat(messages[i]);
		if(lastMsg.offset().top - wrapper.offset().top + lastMsg.height() / 3*2 < wrapper.innerHeight()) raw.scrollTop = raw.scrollHeight;
	}

	addFriendsPopup() {

		let ele = $(`
			<div id="search-wrapper" class="popup-wrapper valign-wrapper" style="display:none;">
				<div id="search-popup" class="popup">
					<div class="popup-top input-field col s6">
						<input placeholder="Search for user..." id="search-users" type="text">
					</div>
					<div id="search-results">
						
					</div>
				</div>
			</div>
		`);

		ele.on('click', (e) => {
			if(e.target.id !== 'search-wrapper') return
			ele.fadeOut(() => ele.remove());
		});

		ele.find('#search-users').on('change', (e) => {
			if(e.target.value <= 3) return;
			chatapp.socket.emit('action', 'search', {
				type:  'users',
				search: e.target.value
			}, (data) => {
				console.log(data)

				ele.find('#search-results').html('');
				
				let container = $('<div/>', {
					class: 'userbar grey lighten-3 z-depth-1'
				});

				let name = (username) => $('<div/>', {
					class: 'username center-align'
				}).append(username);

				let self = $('<div/>', {
					class: 'center-align'
				}).append('This is you!');

				let request = $('<div/>', {
					class: 'center-align'
				}).append('Friend request send!');

				let add = (friendId) => $('<div/>', {
					class: 'waves-effect action center-align'
				}).append('<span><i class="icon material-icons">add</i>Send friend request</span>').one('click', (e) => {

					chatapp.socket.emit('action', 'friends', {
						type:    'request',
						friendId: friendId
					}, (data) => {
						if(data.success) $(e.target).closest('div').removeClass('waves-effect').text('Friend request send');
						else console.error(data.error);
					});
				});

				let remove = (friendId) => $('<div/>', {
					class: 'waves-effect waves-red action center-align'	
				}).append('<span><i class="icon material-icons">block</i>Unfriend</span>').one('click', (e) => {

					chatapp.socket.emit('action', 'friends', {
						type:    'remove',
						friendId: friendId
					}, (data) => {
						if(data.success) $(e.target).closest('div').removeClass('waves-effect').text('Unfriended');
						else console.error(data.error);
					});
				});

				for (let i = 0; i < data.users.length; i++) {
					let cont = container.clone();
					let div = ele.find('#search-results').append(cont.append(name(data.users[i].username)));

					if(data.users[i].friends) cont.append(remove(data.users[i].id).clone(true));
					else if(data.users[i].self) cont.append(self);
					else if(data.users[i].request) cont.append(request);
					else cont.append(add(data.users[i].id).clone(true));
				};
			});
		});

		$('#app').append(ele.fadeIn(() => {
			$('#search-friends').focus();
		}));
	}

	openPopup(ele) {

		ele.fadeIn();

		ele.on('click', (e) => {
			if($(e.target).hasClass('popup-wrapper') || $(e.target).hasClass('popup-close')) ele.fadeOut(() => {
				ele.off('click');
			});
		});

	}

	parseChat(message) {
		let side = message.userId == localStorage.getItem('userId') ? 'right' : 'left';
		let user = side == 'right' ? 'You' : message.username;
		let time = new Date(message.createdAt).toLocaleString().slice(10, -3);
		let date = new Date(message.createdAt).toLocaleDateString();

		let ele = $(`
			<div class="msg-`+ side +`">
				<div class="date center">`+ date +`</div>
				<span class="msg">`+ message.message +`</span>
				<div class="info">
					<span class="user">`+ user +`</span>
					<span class="time">`+ time +`</span>
				</div>
			</div>
		`);

		let list = $('#main-chat-msg').children();

		let userCompleet = false, timeCompleet = false, dateCompleet = false;

		for (let i = list.length - 1; i >= 0; i--) {
			let user2 = $(list[i]).find('.user');
			let time2 = $(list[i]).find('.time');
			let date2 = $(list[i]).find('.date');

			if(user2.length && !userCompleet) if(user == user2.text()) $(ele).find('.user').remove();
			else userCompleet = true;

			if(time2.length && !timeCompleet) if(time == time2.text()) $(ele).find('.time').remove();
			else timeCompleet = true;

			if(date2.length && !dateCompleet) if(date == date2.text()) $(ele).find('.date').remove();
			else dateCompleet = true;

			if(userCompleet && timeCompleet && dateCompleet) break;
		}

		$('#main-chat-msg').append(ele);
		this.scrollLock = false;
	}

	loadChat(id, name) {
		let chat = $(`
			<div id="main-chat-bar" class="row blue lighten-2">
				<div id="main-chat-back" class="col s2 waves-effect center">
					<i class="material-icons hide-on-med-and-up">arrow_back</i>
				</div>
				<div class="col s8 center">
					<span>`+ name +`</span>
				</div>
				<div id="chat-list" class="col s2 waves-effect center">
					<i class="material-icons">userlist</i>
				</div>
				<div id="chat-list-wrapper" class="popup-wrapper valign-wrapper" style="display:none;">
					<div class="popup">
						<div class="popup-top">
							<div class="popup-close grey-text hide-on-med-and-up"><i class="popup-close material-icons">close</i></div>
							<div class="btn left">Add user</div>
							<h5 class="center">User list</h5> 
						</div>
						<div id="chat-list-users"></div>
					</div>
				</div>
			</div>
			
			<div id="chat-progress" class="progress">
				<div class="indeterminate"></div>
			</div>

			<div id="main-chat-msg" class="row chat-width"></div>

			<form id="main-chat-input" class="blue lighten-2 row chat-width">
				<div id="main-input-wrapper" class="col s9 m10 input-field">
					<input type="text" data-length="120" placeholder="Loading messages..." disabled>
				</div>
				<div class="col s1 center">
					<button id="main-chat-send" class="btn green waves-effect waves-light">Send</button>
				</div>
			</form>
		`);

		if($(window).innerWidth() <= 600) {
			$('#main-menu').slideUp();
			$('#main-chat').removeClass('hide-on-small-only');
		}

		this.currentRoomId = id;

		$('#main-chat').fadeOut(() => {
			$('#main-chat').html(chat).fadeIn();

			// Materialize js not working with webpack // add materialze js to config
			// $('#main-chat-input input').characterCounter();

			$('#main-chat-msg').on('wheel', (e) => { if(self.scrollLock) return e.preventDefault() });

			$('#main-chat-back').on('click', (e) => {
				$('#main-menu').slideDown();
				$('#main-chat > *').fadeOut((e) => $(e.target).remove());
			});

			$('#main-chat-input').on('submit', (e) => {
				e.preventDefault();
				let input = $(e.target).find('input');
				if(input.val().length <= 255 && input.val().length) {
					chatapp.socket.emit('action', 'messages', {
						type: 'send',
						roomId: id,
						message: input.val()
					});
					input.val('');
				}
			});

			chatapp.socket.emit('action', 'messages', {
				type: 'get',
				roomId: id
			}, (data) => {
				$('#main-chat-input input').prop('disabled', false).prop('placeholder', 'Type a message...');
				$('#chat-progress').slideUp();

				console.log(data.messages);

				for (var i = 0; i < data.messages.length; i++) this.parseChat(data.messages[i]);
				$('#main-chat-msg').get()[0].scrollTop = 9999;
			});
		});
	}
}
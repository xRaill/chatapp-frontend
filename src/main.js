import _ from 'lodash';

export class main {

	constructor() {

		this.app = $(`
			<div class="row h-4">
				<div id="main-menu" class="col s12 m3 no-padding">

					<div id="main-top" class="h-1 blue lighten-2 z-depth-1">
						<div id="main-user"> `+ chatapp.username +` </div>
						<div id="main-nav" class="auto-margin moveLeft">
							<i id="main-chats" class="material-icons waves-effect center">chat</i>
							<i id="main-users" class="material-icons waves-effect center">people</i>
						</div>
					</div>

					<div id="rooms-progress" class="progress">
						<div class="indeterminate"></div>
					</div>

					<div id="menu-list" class=>
						<div id="menu-rooms"></div>
						<div id="menu-friends"></div>
						<div id="menu-friends-add" 
							class="btn-floating btn-large green waves-effect waves-light hide-on-small-only scale-transition scale-out">
							<i class="large material-icons">add</i>
						</div>
						<div id="menu-friends-add-mobile" 
							class="btn-floating btn-large green waves-effect waves-light hide-on-med-and-up scale-transition scale-out">
							<i class="large material-icons">add</i>
						</div>
					</div>
				</div>

				<div id="main-chat" class="col s12 m9 hide-on-small-only h-4 z-depth-1"></div>
			</div>
		`);

		$('#app').fadeOut(() => {
			$('#app').html(this.app).fadeIn(() => {
				this.beforeEvents();
				this.afterEvents();
				chatapp.socket.emit('action', 'rooms');
				chatapp.socket.emit('action', 'friends');
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

		chatapp.socket.on('room-add', (room) => {
			$('#rooms-progress').slideUp();
			$('#room-'+ room.id).remove();

			let elem = $(`
				<div class="room waves-effect z-depth-1" id="room-`+ room.id +`" data-id="`+ room.id +`">
					<span>`+ room.name +`</span>
				</div>
			`);	

			$('#menu-rooms').append(elem);
		});

		chatapp.socket.on('friend-add', (friend) => {
			$('#friend-'+ friend.id).remove();

			let elem = $(`
				<div class="room waves-effect z-depth-1" id="friend-`+ friend.id +`">
					<span>`+ friend.username +`</span>
				</div>
			`);

			$('#menu-friends').append(elem);
		});

		chatapp.socket.on('message-add', (messages) => {
			if(!messages) return;
			let wrapper = $('#main-chat-msg');
			let lastMsg = wrapper.find('*:last');
			if(wrapper.children().length) if(lastMsg.offset().top - wrapper.offset().top + lastMsg.height() / 3*2 < wrapper.innerHeight()){
				let i = 0, raw = wrapper.get()[0];
				function f() {
					raw.scrollTop = raw.scrollHeight;
					if( i++ < 30 ) setTimeout( f, i * 5 );
				}
				f();
			}
			for (let i = 0; i < messages.length; i++) this.parseChat(messages[i]);
		});
	}

	afterEvents() {
		$('#main-menu').on('click', '#main-chats', (e) => {
			$(e.target).parent().removeClass('moveRight').addClass('moveLeft');
			$('#menu-friends-add, #menu-friends-add-mobile').addClass('scale-out');
			$('#menu-list').animate({
				'margin-left': '0',  
			});
		}).on('click', '#main-users', (e) => {
			$(e.target).parent().removeClass('moveLeft').addClass('moveRight')
			$('#menu-friends-add, #menu-friends-add-mobile').removeClass('scale-out');
			$('#menu-list').animate({
				'margin-left': '-' + $('#menu-list').width()/2,  
			});
		});

		$('#menu-rooms').on('click', '.room', (e) => this.loadChat($(e.target).data('id'), $(e.target).find('span').text()));

		$('#menu-friends-add, #menu-friends-add-mobile').on('click', (e) => this.addFriends());

		$('#menu-list').on('touchstart', (e) => {
			let width = $('#menu-list').width();
			let startMargin = Math.abs($('#menu-list').css('margin-left').slice(0,-2))*-1;
			let oldX = e.originalEvent.touches[0].clientX;
			let newX;

			$('#menu-list').removeClass('menuSlideLeft').removeClass('menuSlideRight').css('margin-left', startMargin);

			$(window).on('touchmove', (e) => {
				newX = e.originalEvent.touches[0].clientX - oldX;
				let newMargin = (newX + startMargin);

				let res;
				if(newMargin <= 0) if(newMargin <= width/2) res = (startMargin >= width/2*-1 ? newMargin : newMargin  - startMargin);
				else res = width/2;
				else res = 0;
				$('#menu-list').css('margin-left', res + 'px');
			});

			$(window).one('touchend', () => {
				$(window).off();
				let range = 20;

				if(newX > range || newX < range*-1) {
					if(startMargin <= width/2*-1) {
						$('#main-nav').removeClass('moveRight').addClass('moveLeft');
						$('#menu-list').animate({
							'margin-left': 0,  
						});
						$('#menu-friends-add, #menu-friends-add-mobile').addClass('scale-out');
					} else {
						$('#main-nav').removeClass('moveLeft').addClass('moveRight');
						$('#menu-list').animate({
							'margin-left': '-' + $('#menu-list').width()/2,  
						});
						$('#menu-friends-add, #menu-friends-add-mobile').removeClass('scale-out');
					}
				} else {
					if(startMargin <= width/2*-1) {
						$('#main-nav').removeClass('moveLeft').addClass('moveRight');
						$('#menu-list').animate({
							'margin-left': '-' + $('#menu-list').width()/2,  
						});
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

	addFriends() {

		let ele = $(`
			<div id="popup-wrapper" class="valign-wrapper" style="display:none;">
				<div id="popup">
					<div class="input-field col s6">
						<input placeholder="Search for user..." id="search-friends" type="text">
					</div>
					<div id="search-friends-results">
						
					</div>
				</div>
			</div>
		`);

		ele.one('click', (e) => {
			if(e.target.id !== 'popup-wrapper') return
			ele.fadeOut(() => ele.remove());
		});

		ele.find('#search-friends').on('change', (e) => {
			if(e.target.value <= 3) return;
			chatapp.socket.emit('action', 'search', {
				search: e.target.value
			}).once('search-response', (users) => {
				ele.find('#search-friends-results').html('');
				for (let i = 0; i < users.length; i++) ele.find('#search-friends-results').append(`
					<div class="user">`+ users[i] +`</div>
				`);
			});
		});

		$('#app').append(ele.fadeIn());
	}

	parseChat(message) {
		let side = message.userId == chatapp.userid ? 'right' : 'left';
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
				<div id="main-chat-back" class="col s2 waves-effect waves-light center">
					<i class="material-icons hide-on-med-and-up">arrow_back</i>
				</div>
				<div class="col s8 center">
					<span>`+ name +`</span>
				</div>
				<div class="col s2 center">???</div>
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
				if(input.val().length <= 120 && input.val().length) {
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
			}).once('message-add', () => {
				$('#main-chat-input input').prop('disabled', false).prop('placeholder', 'Type a message...');
				$('#chat-progress').slideUp();
				$('#main-chat-msg').get()[0].scrollTop = 9999;
			});
		});
	}
}
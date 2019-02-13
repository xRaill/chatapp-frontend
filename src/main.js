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

					<div id="menu-list">
						<div id="menu-rooms"></div>
						<div id="menu-friends"></div>
						<div id="menu-friends-add" class="btn-floating btn-large green waves-effect waves-light scale-transition scale-out">
							<i class="large material-icons">search</i>
						</div>
						<div id="menu-rooms-add" class="btn-floating btn-large green waves-effect waves-light scale-transition">
							<i class="large material-icons">add</i>
						</div>
					</div>
				</div>

				<div id="main-chat" class="col s12 m9 hide-on-small-only h-4"></div>
			</div>
		`);

		$.fn.isInViewport = function() {
		    let elementTop = $(this).offset().top;
		    let elementBottom = elementTop + $(this).outerHeight();

		    let viewportTop = $(window).scrollTop();
		    let viewportBottom = viewportTop + $(window).height();

		    return elementBottom > viewportTop && elementTop < viewportBottom;
		};

		$('#app').fadeOut(() => {
			$('#app').html(this.app).fadeIn(() => {
				this.beforeEvents();
				this.afterEvents();

				this.loadRooms();
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
				if(this.currentRoomId) {
					$('#main-chat').removeClass('hide-on-small-only');
					$('#main-menu').slideUp();
				} else {
					$('#main-chat').addClass('hide-on-small-only');
					$('#main-menu').slideDown();
				}
			} else $('#main-menu').slideDown();
		});

		chatapp.socket.on('rooms-reload', () => this.roomsLoad());

		chatapp.socket.on('friends-request', (friend) => {
			chatapp.toast('blue lighten-3', 'people', friend.username + ' send you a friend request');
			this.loadFriends();
		});

		chatapp.socket.on('messages-add', (messages) => this.messageAdd(messages));
	}

	afterEvents() {
		$('#logout').on('click', () => chatapp.socket.emit({
			type: 'logout'
		}, (data) => {
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
			$('#menu-rooms-add').removeClass('scale-out');
			$('#menu-list').animate({
				'margin-left': '0',  
			});
		}).on('click', '#main-users', (e) => {
			$(e.target).parent().removeClass('moveLeft').addClass('moveRight')
			$('#menu-friends-add').removeClass('scale-out');
			$('#menu-rooms-add').addClass('scale-out');
			$('#menu-list').animate({
				'margin-left': '-' + $('#menu-list').width()/2,  
			});
		});

		$('#menu-friends-add').on('click', (e) => chatapp.getPopup('addFriends'));
		$('#menu-rooms-add').on('click', (e) => chatapp.getPopup('addRooms'));

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

	loadRooms() {
		$('#menu-rooms').html($(`
			<div class="progress menu-progress">
				<div class="indeterminate"></div>
			</div>
		`));

		chatapp.socket.emit({
			type: 'rooms.get'
		}, (data) => {
			if(data.success) {

				for (let i = 0; i < data.rooms.length; i++) {

					let elem = $(`
						<div class="room waves-effect z-depth-1" id="room-`+ data.rooms[i].id +`">
							<span>`+ data.rooms[i].name +`</span>
							<span class="last-msg">`+ (data.rooms[i].lastMsg ? data.rooms[i].lastMsg : '') +`</span>
						</div>
					`);

					$(elem).on('click', (e) => {
						this.loadChat(data.rooms[i].id);
						$('#menu-rooms .active').removeClass('active');
						$(e.target).closest('.room').addClass('active');
					});

					$('#menu-rooms').append(elem);
				}

				$('#menu-rooms .progress').slideUp();
			}
		});
	}

	loadFriends() {
		$('#menu-friends').html($(`
			<div class="progress menu-progress">
				<div class="indeterminate"></div>
			</div>
		`));

		chatapp.socket.emit({
			type: 'friends.get'
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

				for (let i = 0; i < data.friends.length; i++) {
					
					let elem = $(`
						<div class="friend waves-effect z-depth-1" id="friend-`+ data.friends[i].id +`">
							<span>`+ data.friends[i].username +`</span>
						</div>
					`);

					$(elem).on('click', (e) => {
						if(!elem.hasClass('open')) {
							
							let options = $(`
								<div class="friend-options" style="display:none;">
									<div class="darken-bg" style="display:none"></div>
									<div class="action remove waves-effect waves-red red-text center z-depth-1">Remove friend</div>
								</div>
							`);

							$(options).find('.remove').on('click', () => chatapp.getPopup('confirm', {
								title:   'Unfriend',
								message: 'Are you sure you want to unfriend <b>'+ data.friends[i].username +'</b>?',
								callback: (result) => {
									if(result) chatapp.socket.emit({
										type: 'friends.remove',
										friendId: data.friends[i].id
									}, (data2) => {
										if(data2) {
											options.slideUp(() => {
												options.remove();
												elem.slideUp(() => elem.remove());
											}).find('.darken-bg').fadeOut();
											chatapp.toast('blue lighten-3', 'people',
												'You removed <b>'+ data.friends[i].username +'</b> as your friend');
										}
									});
								}
							}));

							$(options).find('.darken-bg').on('click', () => options.slideUp(() => {
								elem.removeClass('open').css('z-index', 0);
								options.remove();
							}).find('.darken-bg').fadeOut());

							elem.after(options);
							options.slideDown().find('.darken-bg').fadeIn();
							elem.addClass('open').css('z-index', 999);
						} else $('.friend-options').slideUp(() => {
							$('.friend-options').remove();
							elem.removeClass('open').css('z-index', 0);
						}).find('.darken-bg').fadeOut();
					});

					$('#menu-friends').append(elem);
				}

				$('#menu-friends .progress').slideUp();
			}
		});
	}

	messageAdd(messages, initial = false, reverse = false) {
		if(!messages) return;

		if(reverse) $('#msgProgress')[0].scrollIntoView();

		if(reverse) messages = messages.reverse();
		for (let i = 0; i < messages.length; i++) this.parseChat(messages[i], initial, reverse, reverse ? i == messages.length -1 : i == 0);

		if(reverse) setTimeout(() => $('#msgProgress').slideUp(() => $('#msgProgress').remove()), 500);

		if(messages.length == 50) {
			let ele = $(`
				<div id="msgTop">
					<div class="progress" style="display:none;">
						<div class="indeterminate"></div>
					</div>
				</div>
			`);

			let event = (e) => {
				if($('#msgTop').isInViewport()) {
					let date = $('#main-chat-msg .date:first').text().split('-').reverse().join('-');
					let time = $('#main-chat-msg .time:first').text();
					let datetime = new Date(date +'T'+ time +':'+ new Date().getSeconds());
					
					ele.find('.progress').slideDown();

					chatapp.socket.emit({
						type: 'messages.get',
						roomId: this.currentRoomId,
						before: datetime
					}, (data) => {
						if(data.success) {
							ele.remove();
							$('#main-chat-msg').prepend($(`
								<div id="msgProgress" class="progress">
								<div class="indeterminate"></div>
								</div>
							`));
							this.messageAdd(data.messages, false, true);
						}
					});
				} else $('#main-chat-msg').one('scroll', event);
			};

			setTimeout(() => $('#main-chat-msg').one('scroll', event), 1000);

			$('#main-chat-msg').prepend(ele);
		}

		if(messages[0].roomId == this.currentRoomId) {

			let date = $('#main-chat-msg .date:last').text().split('-').reverse().join('-');
			let time = $('#main-chat-msg .time:last').text();
			let datetime = new Date(date +'T'+ time +':'+ new Date().getSeconds());

			if($('#main-chat-msg > div').length && !initial) {

				$(document).off('focus');
				$('#main-chat-msg').off('scroll')

				if(document.hasFocus() && $('#main-chat-msg > div:last').isInViewport()) chatapp.socket.emit({
					type:  'rooms.read',
					roomId: messages[0].roomId
				}, (data) => {
					if(data.success) $('#main-chat-msg .new').slideUp(() => $('#main-chat-msg .new').remove());
				});

				else if(!document.hasFocus() && $('#main-chat-msg > div:last > .msg').isInViewport()) {
					$(document).off('focus').one('focus', () => setTimeout(() => chatapp.socket.emit({
						type:  'rooms.read',
						roomId: messages[0].roomId
					}, (data) => {
						if(data.success) $('#main-chat-msg .new').slideUp(() => $('#main-chat-msg .new').remove());
					}), 5000));
				}

				else if(!document.hasFocus() && !$('#main-chat-msg > div:last > .msg').isInViewport()) {
					let event = (e) => {
						if($('#main-chat-msg > div:last').isInViewport()) {
							setTimeout(() => chatapp.socket.emit({
								type:  'rooms.read',
								roomId: messages[0].roomId,
								date:   datetime
							}, (data) => {
								if(data.success) $('#main-chat-msg .new').slideUp(() => $('#main-chat-msg .new').remove());
							}), 5000);
						} else $('#main-chat-msg').one('scroll', event);
					}

					$('#main-chat-msg').one('scroll', event);
				}
			}
		}

		if(!reverse && $('#room-'+ messages[0].roomId).length) {
			let lastMsg  = messages[messages.length - 1];
			let username = lastMsg.username == localStorage.username ? 'You' : lastMsg.username;

			$('#room-'+ lastMsg.roomId).find('.last-msg').slideUp(100, () => {
				$('#room-'+ lastMsg.roomId).find('.last-msg').text(username + ': ' + lastMsg.message).slideDown(100);
			});
		}
	}

	parseChat(message, initial = false, reverse = false, lastI = false) {
		if($('#msg-'+ message.id).length) return;

		let side = message.userId == localStorage.getItem('userId') ? 'right' : 'left';
		let user = side == 'right' ? 'You' : message.username;
		let time = new Date(message.createdAt).toLocaleString().split(' ')[1].slice(0, -3);
		let date = new Date(message.createdAt).toLocaleDateString();

		let ele = $(`
			<div class="msg-`+ side + (reverse ? '' : ' animate') + (lastI ? ' lastMsg' : '') +`" id="msg-`+ message.id +`">
				<div class="new center">New message(s)</div>
				<div class="date center">`+ date +`</div>
				<span class="msg">`+ message.message +`</span>
				<div class="info">
					<span class="user">`+ user +`</span>
					<span class="time">`+ time +`</span>
				</div>
			</div>
		`);

		if($('#main-chat-msg .new').length || message.read) $(ele).find('.new').remove();

		let list = $('#main-chat-msg').children();

		if(reverse) list = list.toArray().reverse();

		let userCompleet = false, timeCompleet = false, dateCompleet = false;

		for (let i = list.length - 1; i >= 0; i--) {
			let user2 = $(list[i]).find('.user');
			let time2 = $(list[i]).find('.time');
			let date2 = $(list[i]).find('.date');

			if(user2.length && !userCompleet || lastI) if(user == user2.text() && !lastI) $(ele).find('.user').remove();
			else userCompleet = true;

			if(time2.length && !timeCompleet) if(time == time2.text()) $(ele).find('.time').remove();
			else timeCompleet = true;

			if(date2.length && !dateCompleet) if(date == date2.text()) $(ele).find('.date').remove();
			else dateCompleet = true;

			if(userCompleet && timeCompleet && dateCompleet) break;
		}

		if(reverse) $('#main-chat-msg').prepend(ele);
		else $('#main-chat-msg').append(ele);

		let last = $('#main-chat-msg > div:last');

		if(!initial && last.length && last.isInViewport()) $('#main-chat-msg > div:last')[0].scrollIntoView({
			behavior: 'smooth'
		});
	}

	loadChat(id) {
		let chat = $(`
			<div id="main-chat-bar" class="row blue lighten-2">
				<div id="main-chat-back" class="col s2 waves-effect center">
					<i class="material-icons hide-on-med-and-up">arrow_back</i>
				</div>
				<div class="col s6 m8 center">
					<span id="chat-name">...</span>
				</div>
				<div id="chat-add" class="col s2 m1 waves-effect center">
					<i class="material-icons">add</i>
				</div>
				<div id="chat-list" class="col s2 m1 waves-effect center">
					<i class="material-icons">userlist</i>
				</div>
			</div>
			
			<div id="chat-progress" class="progress">
				<div class="indeterminate"></div>
			</div>

			<div id="main-chat-msg" class="row chat-width"></div>

			<div id="main-chat-input" class="blue lighten-2 row chat-width">
				<div id="main-input-wrapper" class="col s9 m10 input-field">
					<textarea data-length="255" placeholder="Loading messages..." class="materialize-textarea" disabled></textarea>
				</div>
				<div class="col s1 center">
					<button id="main-chat-send" class="btn green waves-effect waves-light">Send</button>
				</div>
			</div>
		`);

		if($(window).innerWidth() <= 600) {
			$('#main-menu').slideUp();
			$('#main-chat').removeClass('hide-on-small-only');
		}

		this.currentRoomId = id;

		$('#main-chat').fadeOut(() => {
			$('#main-chat').html(chat).fadeIn();

			$('#main-chat-input textarea').characterCounter();

			$('#chat-list').on('click', () => chatapp.getPopup('roomUserList', { roomId: id }));
			$('#chat-add').on('click', () => chatapp.getPopup('chatFriendAdd', { roomId: id }));

			$('#main-chat-back').on('click', (e) => {
				$('#menu-rooms .active').removeClass('active');
				$('#main-menu').slideDown();
				$('#main-chat > *').fadeOut(() => $('#main-chat > *').remove());
				delete this.currentRoomId;
			});

			$('#main-chat-input textarea').on('keypress', (e) => {
				if(e.originalEvent.key == 'Enter') $('#main-chat-send').trigger('click');
			});

			$('#main-chat-send').on('click', (e) => {
				e.preventDefault();
				let input = $('#main-chat-input').find('textarea');
				if(input.val().length <= 255 && input.val().length) {
					chatapp.socket.emit({
						type: 'messages.send',
						roomId: id,
						message: input.val()
					}, (data) => {
						input.val('');
						M.textareaAutoResize(input);
					});
				}
			});

			chatapp.socket.emit({
				type: 'rooms.get',
				roomId: id
			}, (data) => {
				$('#chat-name').text(data.name);

				chatapp.socket.emit({
					type: 'messages.get',
					roomId: id
				}, (data) => {
					$('#main-chat-input textarea').prop('disabled', false).prop('placeholder', 'Type a message...');
					$('#chat-progress').slideUp();

					this.messageAdd(data.messages, true);
					
					if($('#main-chat-msg .new').length) {
						$('#main-chat-msg').animate({
							scrollTop: $('#main-chat-msg .new').offset().top / 7 * 3
						});
						setTimeout(() => $('#main-chat-msg .new')[0].scrollIntoView({
							block: 'center'
						}), 900);
					} else $('#main-chat-msg > div:last')[0].scrollIntoView();
				});
				
			});

		});
	}
}
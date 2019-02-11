let popup = require('./popup.js').popup;

export class addRooms {

	constructor(args = {}) {
		this.popup = new popup({
			id:      'addRoom',
			title:   'Add Room',
			closable: false
		});

		$(this.popup.body).html($(`
			<div class="valign-wrapper" style="height:50%">
				<div class="row" style="width:100%;">
					<div class="input-field col s10 push-s1">
						<input id="roomName" type="text" data-length="15">
						<label for="roomName">Room name</label>
						<span class="helper-text red-text scale-transition center scale-out" id="login-password-helper">test</span>
					</div>
				</div>
			</div>
		`));

		$(this.popup.body).find('.input-field input').characterCounter();

		$(this.popup.body).find('.input-field input').on('keydown', (e) => $(e.target).parent().children('.helper-text').addClass('scale-out'));

		$(this.popup.buttons).html($(`
			<div class="cancel btn red waves-effect left">Cancel</div>
			<div class="create btn green waves-effect right">Create</div>
		`));

		$(this.popup.buttons).find('.create').on('click', () => this.create());

		$(this.popup.buttons).find('.cancel').on('click', () => this.popup.destroy());
	}

	create() {
		let ele = $(this.popup.body).find('.input-field');
		let val = ele.find('input').val();

		if(!val.length) return ele.find('.helper-text').removeClass('scale-out').text('No name given'); 

		if(val.length > 15) return ele.find('.helper-text').removeClass('scale-out').text('Name too long');

		chatapp.socket.emit({
			type: 'rooms.create',
			name: val
		}, (data) => {
			if(data.success) {
				chatapp.main.loadRooms();
				this.popup.destroy();
			}
		});
	}

}
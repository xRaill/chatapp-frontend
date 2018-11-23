import _ from 'lodash';

class CHAT {

	constructor() {

		let self = this;
	
		let app = `
		<div id="sidebar">
			<div id="user">
			</div>
			<div id="conversations">
			</div>
		</div>
		<div id="content">
		</div>`;

		$('#app').fadeOut(() => {
			$('#app').html(app).fadeIn(() => {
				self.conversations();
				this.events();
			});
		});
	}

	events() {
		$('#conversations').on('click', '.conv', (e) => {
			let target = e.target;
			let type   = $(target).data('type');
			let id     = $(target).data('id');

			new room(id, type);

			$('#conversations .selected').removeClass('selected');
			$(target).addClass('selected');
		});
	}

	conversations() {
		let conversations = [
			{
				type:    'duo',
				id:       2,
				users:  ['User1'],
				lastMsg: 'Hallo'
			},
			{
				type:    'group',
				id:       1,
				users:  ['User1', 'User2'],
				lastMsg: 'Hi'
			}
		];

		for (let i = 0; i < conversations.length; i++) {
			let conv = conversations[i];
			let div = `
				<div class="conv" data-type="`+conv.type+`" data-id="`+conv.id+`">
					<b>`+conv.users.toString()+`</b>
					<br>`+conv.lastMsg+`
				</div>
			`;		
			$('#conversations').append(div);
		}
	}

}
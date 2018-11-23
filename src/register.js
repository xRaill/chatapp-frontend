import _ from 'lodash';

export class register {

	constructor() {

		let self = this;

		let app = `
			<div class="row valign-wrapper h-3">
				<div class="col s10 offset-s1 m4 offset-m4 card blue lighten-2">		
					<form class="card-content center-align" id="register-form">
						<span class="card-title">Register</span>
							<div class="input-field">
								<input type="text" id="register-username">
								<label class="white-text" for="register-username">Username</label>
								<span class="helper-text red-text scale-transition scale-out" id="register-username-helper"></span>
							</div>
							<div class="input-field">
								<input type="password" id="register-password">
								<label class="white-text" for="register-password">Password</label>
								<span class="helper-text red-text scale-transition scale-out" id="register-password-helper"></span>
							</div>
							<div class="input-field">
								<input type="password" id="register-password-repeat">
								<label class="white-text" for="register-password-repeat">Repeat password</label>
								<span class="helper-text red-text scale-transition scale-out" id="register-password-repeat-helper"></span>
							</div>
						<div class="card-action">
							<button class="btn waves-effect waves-light" id="login-submit">Create account</button>
						</div>
						<a class="waves-effect waves-teal btn-flat" data-route="login">Login</a>
					</form>
				</div>
			</div>
		`;

		chatapp.page = 'register';

		// Display page with fade
		$('#app').fadeOut(() => {
			$('#app').html(app).fadeIn(() => {
				self.events();
			});
		});
	}

	events() {

		$('#login-submit').on('click', (e) => {
			e.preventDefault();

			// Disable input and make button pulse
			$('#login-form input').prop('disabled', true);
			$('#login-submit').addClass(['pulse', 'green']);
			
			let username = $('#register-username').val();
			let password = $('#register-password').val();
			let passrpt  = $('#register-password-repeat').val();

			let err = {u:0,p:0,r:0};

			// Check for errors
			if      (!username)                    err.u = 'No value entered.';
			else if (username.length <  5)         err.u = 'Too short!';
			else if (username.length > 18)         err.u = 'Too long!';
			else if (/[^a-z0-9]/gi.test(username)) err.u = 'No special characters allowed!';

			if      (!password)            err.p = 'No value entered.';
			else if (password.length <  5) err.p = 'Too short!';
			else if (password.length > 30) err.p = 'Too long!';

			if      (!passrpt)            err.r = 'No value entered!';
			else if (passrpt != password) err.r = 'Password does not match!';

			// If error display error
			if(err.u || err.p || err.r) {
				if(err.u) $('#register-username').one('change', () => {
					$('#register-username-helper').addClass('scale-out');
				}).parent().children('span').text(err.u).removeClass('scale-out');

				if(err.p) $('#register-password').one('change', () => {
					$('#register-password-helper').addClass('scale-out');
				}).parent().children('span').text(err.p).removeClass('scale-out');
					
				if(err.r) $('#register-password-repeat').one('change', () => {
					$('#register-password-repeat-helper').addClass('scale-out');
				}).parent().children('span').text(err.r).removeClass('scale-out');

				$('#login-form input').prop('disabled', false);
				$('#login-submit').removeClass(['pulse', 'green']);
				
				return false;
			}

			// Small delay
			setTimeout(() => {
				// Check login info
				chatapp.socket.emit('action', 'register', {
					username: username,
					password: password,
					passrpt:  passrpt
				}).once('register', (data) => {
					if(data.success) {
						chatapp.toast('green', 'check', 'Registration complete.');
					} else {
						$('#login-form input').prop('disabled', false);
						$('#login-submit').removeClass(['pulse', 'green']);

						if(data.type == 'toast') chatapp.toast('red', 'warning', data.message);
						else $('#register-'+ data.type).one('change', () => {
							$('#register-'+ data.type +'-helper').addClass('scale-out');
						}).parent().children('span').text(data.message).removeClass('scale-out');
					}
				});
			}, 1000);

		});
	}

}